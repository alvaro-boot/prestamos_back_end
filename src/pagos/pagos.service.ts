import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { Cuota } from '../cuotas/entities/cuota.entity';
import { Prestamo } from '../prestamos/entities/prestamo.entity';
import { CreatePagoDto } from './dto/create-pago.dto';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private pagoRepo: Repository<Pago>,
    @InjectRepository(Cuota)
    private cuotaRepo: Repository<Cuota>,
    @InjectRepository(Prestamo)
    private prestamoRepo: Repository<Prestamo>,
    private dataSource: DataSource,
  ) {}

  async findByPrestamo(prestamoId: number) {
    return this.pagoRepo.find({
      where: { prestamoId },
      relations: ['cuota'],
      order: { fechaPago: 'DESC' },
    });
  }

  async registrarPago(prestamoId: number, dto: CreatePagoDto) {
    const prestamo = await this.prestamoRepo.findOne({
      where: { id: prestamoId },
    });
    if (!prestamo) throw new NotFoundException('Préstamo no encontrado');
    if (prestamo.estado !== 'ACTIVO') {
      throw new BadRequestException(
        'Solo se pueden registrar pagos en préstamos activos',
      );
    }

    const ordenAbono = dto.es_abono ? 'DESC' : 'ASC';
    const cuotasPendientes = await this.cuotaRepo
      .createQueryBuilder('c')
      .where('c.prestamoId = :prestamoId', { prestamoId })
      .andWhere('c.saldoCuota > 0')
      .orderBy('c.fechaVencimiento', ordenAbono)
      .getMany();
    if (cuotasPendientes.length === 0) {
      throw new BadRequestException('No hay cuotas pendientes');
    }

    let montoRestante = dto.monto_pagado;
    const pagosRegistrados: { pago: Pago; cuotaId: number; monto: number }[] =
      [];

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (const cuota of cuotasPendientes) {
        if (montoRestante <= 0) break;
        const montoAplicar = Math.min(Number(cuota.saldoCuota), montoRestante);
        if (montoAplicar <= 0) continue;

        const nuevoSaldo = Number(cuota.saldoCuota) - montoAplicar;
        const nuevoEstado = nuevoSaldo <= 0 ? 'PAGADA' : 'PARCIAL';

        await queryRunner.manager.update(Cuota, cuota.id, {
          saldoCuota: Math.round(nuevoSaldo * 100) / 100,
          estado: nuevoEstado,
        });

        const pago = queryRunner.manager.create(Pago, {
          prestamoId,
          cuotaId: cuota.id,
          montoPagado: montoAplicar,
          metodoPago: dto.metodo_pago || 'EFECTIVO',
          referencia: dto.referencia,
          observacion: dto.observacion,
        });
        const savedPago = await queryRunner.manager.save(pago);
        pagosRegistrados.push({
          pago: savedPago,
          cuotaId: cuota.id,
          monto: montoAplicar,
        });
        montoRestante -= montoAplicar;
      }

      await queryRunner.commitTransaction();
      return {
        mensaje: 'Pago registrado',
        monto_aplicado: dto.monto_pagado - montoRestante,
        monto_sobrante: montoRestante,
        pagos: pagosRegistrados,
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }
}
