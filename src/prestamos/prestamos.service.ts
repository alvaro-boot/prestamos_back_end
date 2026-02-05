import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Prestamo } from './entities/prestamo.entity';
import { PrestamoVersion } from '../prestamo-versiones/entities/prestamo-version.entity';
import { Cuota } from '../cuotas/entities/cuota.entity';
import { HistorialPrestamo } from '../historial-prestamo/entities/historial-prestamo.entity';
import { FrecuenciaPago } from '../frecuencia-pago/entities/frecuencia-pago.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { CreatePrestamoDto } from './dto/create-prestamo.dto';
import { UpdatePrestamoDto } from './dto/update-prestamo.dto';
import { PagosService } from '../pagos/pagos.service';

@Injectable()
export class PrestamosService {
  constructor(
    @InjectRepository(Prestamo)
    private prestamoRepo: Repository<Prestamo>,
    @InjectRepository(PrestamoVersion)
    private versionRepo: Repository<PrestamoVersion>,
    @InjectRepository(Cuota)
    private cuotaRepo: Repository<Cuota>,
    @InjectRepository(HistorialPrestamo)
    private historialRepo: Repository<HistorialPrestamo>,
    @InjectRepository(FrecuenciaPago)
    private frecuenciaRepo: Repository<FrecuenciaPago>,
    @InjectRepository(Cliente)
    private clienteRepo: Repository<Cliente>,
    private dataSource: DataSource,
    private pagosService: PagosService,
  ) {}

  /**
   * Dashboard: total prestado (capital inicial), total cobrado, interés ganado (según lo pagado).
   */
  async getDashboard(organizacionId: number) {
    const prestamos = await this.prestamoRepo.find({
      where: { organizacionId },
      relations: ['versiones', 'versiones.cuotas'],
    });

    let totalPrestado = 0;
    let totalCobrado = 0;
    let totalGanado = 0;

    for (const p of prestamos) {
      const versiones = (p.versiones || []).sort(
        (a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime(),
      );

      for (let i = 0; i < versiones.length; i++) {
        const v = versiones[i];
        const monto = Number(v.monto);
        const montoTotal = Number(v.montoTotal);
        const totalInteres = montoTotal - monto;
        const cuotas = v.cuotas || [];
        const numCuotas = cuotas.length || 1;
        const interesPorCuota = totalInteres / numCuotas;
        const montoCuota = numCuotas > 0 ? montoTotal / numCuotas : 0;

        if (i === 0) totalPrestado += monto;

        for (const c of cuotas) {
          const montoC = Number(c.montoCuota);
          const saldoC = Number(c.saldoCuota);
          const pagado = Math.max(0, montoC - saldoC);
          totalCobrado += pagado;
          if (montoC > 0 && pagado > 0) {
            totalGanado += pagado * (interesPorCuota / montoC);
          }
        }
      }
    }

    return {
      total_prestado: Math.round(totalPrestado * 100) / 100,
      total_cobrado: Math.round(totalCobrado * 100) / 100,
      total_ganado: Math.round(totalGanado * 100) / 100,
    };
  }

  async findAll(
    organizacionId: number,
    clienteId?: number,
    estado?: string,
    page = 1,
    limit = 10,
  ) {
    const qb = this.prestamoRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.cliente', 'c')
      .where('p.organizacionId = :organizacionId', { organizacionId })
      .orderBy('p.id', 'DESC');
    if (clienteId) qb.andWhere('p.clienteId = :clienteId', { clienteId });
    if (estado) qb.andWhere('p.estado = :estado', { estado });
    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: number, organizacionId: number) {
    const prestamo = await this.prestamoRepo.findOne({
      where: { id, organizacionId },
      relations: [
        'cliente',
        'versiones',
        'versiones.cuotas',
        'versiones.frecuenciaPago',
      ],
    });
    if (!prestamo) throw new NotFoundException('Préstamo no encontrado');
    return prestamo;
  }

  /**
   * Interés simple mensual (COP).
   * Ej: 100.000 al 10% mensual por 1 mes = 10.000 interés → Total 110.000
   * Si paga quincenal: 110.000 / 2 = 55.000 por cuota (interés 10.000/mes ÷ 2 = 5.000 por quincena)
   */
  private calcularCuotaSimple(
    monto: number,
    tasaMensualPorcentaje: number,
    plazoMeses: number,
    cuotasPorMes: number,
  ): number {
    const totalInteres = monto * (tasaMensualPorcentaje / 100) * plazoMeses;
    const totalAPagar = monto + totalInteres;
    const numCuotas = plazoMeses * cuotasPorMes;
    return totalAPagar / numCuotas;
  }

  private generarCuotas(
    prestamoId: number,
    versionId: number,
    monto: number,
    interesPorcentaje: number,
    plazoMeses: number,
    cuotasPorMes: number,
    fechaInicio: Date,
  ): Cuota[] {
    const totalCuotas = plazoMeses * cuotasPorMes;
    const cuotaFija = this.calcularCuotaSimple(
      monto,
      interesPorcentaje,
      plazoMeses,
      cuotasPorMes,
    );
    return this.generarCuotasConMonto(
      prestamoId,
      versionId,
      cuotaFija,
      totalCuotas,
      cuotasPorMes,
      fechaInicio,
    );
  }

  /**
   * Genera cuotas redistribuyendo un monto fijo en N cuotas (sin agregar interés).
   * Usado al refinanciar: las cuotas ya pagadas se descuentan del total.
   */
  private generarCuotasRedistribuidas(
    prestamoId: number,
    versionId: number,
    saldoTotal: number,
    numCuotas: number,
    cuotasPorMes: number,
    fechaInicio: Date,
  ): Cuota[] {
    const montoBase = Math.floor((saldoTotal / numCuotas) * 100) / 100;
    const ajuste = Math.round((saldoTotal - montoBase * numCuotas) * 100) / 100;
    const cuotas: Cuota[] = [];
    let fecha = new Date(fechaInicio);
    for (let i = 1; i <= numCuotas; i++) {
      const montoCuota = i === 1 ? montoBase + ajuste : montoBase;
      cuotas.push(
        this.cuotaRepo.create({
          prestamoId,
          prestamoVersionId: versionId,
          numeroCuota: i,
          montoCuota: Math.round(montoCuota * 100) / 100,
          saldoCuota: Math.round(montoCuota * 100) / 100,
          fechaVencimiento: new Date(fecha),
          estado: 'PENDIENTE',
        }),
      );
      if (cuotasPorMes === 1) {
        fecha.setMonth(fecha.getMonth() + 1);
      } else {
        fecha.setDate(fecha.getDate() + 15);
      }
    }
    return cuotas;
  }

  private generarCuotasConMonto(
    prestamoId: number,
    versionId: number,
    montoCuota: number,
    totalCuotas: number,
    cuotasPorMes: number,
    fechaInicio: Date,
  ): Cuota[] {
    const cuotas: Cuota[] = [];
    let fecha = new Date(fechaInicio);
    const montoRedondeado = Math.round(montoCuota * 100) / 100;
    for (let i = 1; i <= totalCuotas; i++) {
      cuotas.push(
        this.cuotaRepo.create({
          prestamoId,
          prestamoVersionId: versionId,
          numeroCuota: i,
          montoCuota: montoRedondeado,
          saldoCuota: montoRedondeado,
          fechaVencimiento: new Date(fecha),
          estado: 'PENDIENTE',
        }),
      );
      if (cuotasPorMes === 1) {
        fecha.setMonth(fecha.getMonth() + 1);
      } else {
        fecha.setDate(fecha.getDate() + 15);
      }
    }
    return cuotas;
  }

  async create(dto: CreatePrestamoDto, organizacionId: number) {
    const cliente = await this.clienteRepo.findOne({
      where: { id: dto.cliente_id, organizacionId },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    const frecuencia = await this.frecuenciaRepo.findOne({
      where: { id: dto.frecuencia_pago_id },
    });
    if (!frecuencia)
      throw new NotFoundException('Frecuencia de pago no encontrada');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const prestamo = queryRunner.manager.create(Prestamo, {
        clienteId: dto.cliente_id,
        organizacionId,
        estado: 'ACTIVO',
      });
      const savedPrestamo = await queryRunner.manager.save(prestamo);

      const totalCuotas = dto.plazo_meses * frecuencia.cuotasPorMes;
      const fechaInicio = new Date(dto.fecha_inicio);

      let montoTotal: number;
      let cuotas: Cuota[];

      if (dto.monto_cuota != null && dto.monto_cuota > 0) {
        montoTotal = Math.round(dto.monto_cuota * totalCuotas * 100) / 100;
      } else {
        montoTotal =
          dto.monto * (1 + (dto.interes_porcentaje / 100) * dto.plazo_meses);
        montoTotal = Math.round(montoTotal * 100) / 100;
      }

      const version = queryRunner.manager.create(PrestamoVersion, {
        prestamoId: savedPrestamo.id,
        frecuenciaPagoId: dto.frecuencia_pago_id,
        monto: dto.monto,
        interesPorcentaje: dto.interes_porcentaje,
        plazoMeses: dto.plazo_meses,
        montoTotal,
        fechaInicio,
      });
      const savedVersion = await queryRunner.manager.save(version);

      if (dto.monto_cuota != null && dto.monto_cuota > 0) {
        cuotas = this.generarCuotasConMonto(
          savedPrestamo.id,
          savedVersion.id,
          dto.monto_cuota,
          totalCuotas,
          frecuencia.cuotasPorMes,
          fechaInicio,
        );
      } else {
        cuotas = this.generarCuotas(
          savedPrestamo.id,
          savedVersion.id,
          dto.monto,
          dto.interes_porcentaje,
          dto.plazo_meses,
          frecuencia.cuotasPorMes,
          fechaInicio,
        );
      }
      await queryRunner.manager.save(cuotas);

      await queryRunner.manager.save(HistorialPrestamo, {
        prestamoId: savedPrestamo.id,
        accion: 'CREACION',
        estadoNuevo: 'ACTIVO',
        observacion: 'Préstamo creado',
      });

      await queryRunner.commitTransaction();
      return this.findOne(savedPrestamo.id, organizacionId);
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, dto: UpdatePrestamoDto, organizacionId: number) {
    const prestamo = await this.findOne(id, organizacionId);
    if (!prestamo) throw new NotFoundException('Préstamo no encontrado');

    const modificarCuotas =
      (dto.plazo_meses != null || dto.frecuencia_pago_id != null) &&
      prestamo.estado === 'ACTIVO';

    if (modificarCuotas) {
      return this.modificarPlazoYCuotas(id, dto, organizacionId);
    }

    const estadoAnterior = prestamo.estado;
    if (dto.estado && dto.estado !== estadoAnterior) {
      await this.historialRepo.save({
        prestamoId: id,
        accion: 'CAMBIO_ESTADO',
        estadoAnterior,
        estadoNuevo: dto.estado,
      });
      await this.prestamoRepo.update(id, { estado: dto.estado });
    }
    return this.findOne(id, organizacionId);
  }

  /**
   * Marca el préstamo como PAGADO y salda todas las cuotas pendientes (saldo = 0).
   */
  async saldar(id: number, organizacionId: number) {
    const prestamo = await this.prestamoRepo.findOne({
      where: { id, organizacionId },
    });
    if (!prestamo) throw new NotFoundException('Préstamo no encontrado');
    if (prestamo.estado === 'PAGADO') {
      throw new BadRequestException('El préstamo ya está pagado');
    }

    const cuotasConSaldo = await this.cuotaRepo.find({
      where: { prestamoId: id },
    });
    const pendientes = cuotasConSaldo.filter((c) => Number(c.saldoCuota) > 0);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.update(Prestamo, id, { estado: 'PAGADO' });
      for (const c of pendientes) {
        await queryRunner.manager.update(Cuota, c.id, {
          saldoCuota: 0,
          estado: 'PAGADA',
        });
      }

      await queryRunner.manager.save(HistorialPrestamo, {
        prestamoId: id,
        accion: 'SALDADO',
        estadoAnterior: prestamo.estado,
        estadoNuevo: 'PAGADO',
        observacion: 'Préstamo saldado en su totalidad',
      });

      await queryRunner.commitTransaction();
      return this.findOne(id, organizacionId);
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Modifica plazo y/o frecuencia de pago.
   * Sin pagos: actualiza versión y regenera cuotas.
   * Con pagos: refinancia el saldo pendiente en nueva versión.
   */
  private async modificarPlazoYCuotas(
    prestamoId: number,
    dto: UpdatePrestamoDto,
    organizacionId: number,
  ) {
    const prestamo = await this.prestamoRepo.findOne({
      where: { id: prestamoId, organizacionId },
      relations: ['versiones', 'versiones.frecuenciaPago'],
    });
    if (!prestamo) throw new NotFoundException('Préstamo no encontrado');

    const versionActual = prestamo.versiones?.sort(
      (a, b) => (b.id as number) - (a.id as number),
    )[0];
    if (!versionActual)
      throw new BadRequestException('No se encontró versión del préstamo');

    const pagos = await this.pagosService.findByPrestamo(prestamoId);
    const sinPagos = pagos.length === 0;

    const newPlazo = dto.plazo_meses ?? versionActual.plazoMeses;
    const newFrecuenciaId =
      dto.frecuencia_pago_id ?? versionActual.frecuenciaPagoId;
    const frecuencia = await this.frecuenciaRepo.findOne({
      where: { id: newFrecuenciaId },
    });
    if (!frecuencia)
      throw new NotFoundException('Frecuencia de pago no encontrada');

    if (sinPagos) {
      return this.modificarSinPagos(
        prestamoId,
        versionActual,
        newPlazo,
        newFrecuenciaId,
        frecuencia,
        organizacionId,
      );
    }

    const cuotasPendientes = await this.cuotaRepo.find({
      where: { prestamoId, prestamoVersionId: versionActual.id },
    });
    const conSaldo = cuotasPendientes.filter((c) => Number(c.saldoCuota) > 0);
    const saldoPendiente = conSaldo.reduce(
      (sum, c) => sum + Number(c.saldoCuota),
      0,
    );

    if (saldoPendiente <= 0) {
      throw new BadRequestException(
        'No hay saldo pendiente. El préstamo ya está pagado.',
      );
    }

    const primeraVersion = prestamo.versiones?.sort(
      (a, b) => (a.id as number) - (b.id as number),
    )[0];
    const capitalOriginal = Number(
      primeraVersion?.monto || versionActual.monto,
    );
    const capitalEnVersionActual =
      primeraVersion && versionActual.id === primeraVersion.id
        ? capitalOriginal
        : Number(versionActual.monto);

    return this.refinanciar(
      prestamoId,
      versionActual,
      cuotasPendientes,
      conSaldo,
      saldoPendiente,
      capitalOriginal,
      capitalEnVersionActual,
      newPlazo,
      newFrecuenciaId,
      frecuencia,
      organizacionId,
    );
  }

  private async modificarSinPagos(
    prestamoId: number,
    versionActual: PrestamoVersion,
    newPlazo: number,
    newFrecuenciaId: number,
    frecuencia: FrecuenciaPago,
    organizacionId: number,
  ) {
    const monto = Number(versionActual.monto);
    const interesPorcentaje = versionActual.interesPorcentaje;
    const montoTotal = monto * (1 + (interesPorcentaje / 100) * newPlazo);
    const fechaInicio = new Date(versionActual.fechaInicio);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.update(PrestamoVersion, versionActual.id, {
        plazoMeses: newPlazo,
        frecuenciaPagoId: newFrecuenciaId,
        montoTotal: Math.round(montoTotal * 100) / 100,
      });

      await queryRunner.manager.delete(Cuota, {
        prestamoId,
        prestamoVersionId: versionActual.id,
      });

      const cuotas = this.generarCuotas(
        prestamoId,
        versionActual.id,
        monto,
        interesPorcentaje,
        newPlazo,
        frecuencia.cuotasPorMes,
        fechaInicio,
      );
      await queryRunner.manager.save(cuotas);

      await queryRunner.manager.save(HistorialPrestamo, {
        prestamoId,
        accion: 'MODIFICACION',
        estadoAnterior: `${versionActual.plazoMeses} meses`,
        estadoNuevo: `${newPlazo} meses, ${frecuencia.descripcion || frecuencia.codigo}`,
        observacion: `Modificado sin pagos: ${newPlazo} meses, ${frecuencia.descripcion || frecuencia.codigo}`,
      });

      await queryRunner.commitTransaction();
      return this.findOne(prestamoId, organizacionId);
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  private async refinanciar(
    prestamoId: number,
    versionActual: PrestamoVersion,
    todasLasCuotas: Cuota[],
    conSaldo: Cuota[],
    saldoPendiente: number,
    capitalOriginal: number,
    capitalEnVersionActual: number,
    newPlazo: number,
    newFrecuenciaId: number,
    frecuencia: FrecuenciaPago,
    organizacionId: number,
  ) {
    const interesPorcentaje = versionActual.interesPorcentaje;

    // Interés por cuota FIJO: (capital original × tasa) ÷ cuotas por mes. Nunca cambia.
    const interesMensual = capitalOriginal * (interesPorcentaje / 100);
    const interesPorCuota =
      Math.round((interesMensual / frecuencia.cuotasPorMes) * 100) / 100;

    const totalCuotasOriginal =
      versionActual.plazoMeses *
      (versionActual.frecuenciaPago?.cuotasPorMes ?? 1);
    const capitalPorCuotaOriginal =
      totalCuotasOriginal > 0
        ? capitalEnVersionActual / totalCuotasOriginal
        : 0;

    // Capital ya pagado: en cada cuota, la parte pagada (montoCuota - saldoCuota) es proporcional capital+interés
    const capitalPagado = todasLasCuotas.reduce((sum, c) => {
      const montoC = Number(c.montoCuota);
      const saldoC = Number(c.saldoCuota);
      if (montoC <= 0) return sum;
      const pagadoEnCuota = montoC - saldoC;
      const proporcionPagada = pagadoEnCuota / montoC;
      return sum + capitalPorCuotaOriginal * proporcionPagada;
    }, 0);

    let capitalRestante =
      Math.round((capitalEnVersionActual - capitalPagado) * 100) / 100;
    if (capitalRestante <= 0) {
      const numConSaldo = conSaldo.length;
      const interesEnSaldo = interesPorCuota * numConSaldo;
      capitalRestante =
        Math.round((saldoPendiente - interesEnSaldo) * 100) / 100;
      if (capitalRestante <= 0) {
        capitalRestante = Math.round(saldoPendiente * 100) / 100;
      }
    }

    const newTotalCuotas = newPlazo * frecuencia.cuotasPorMes;
    const cuotasAGenerar = Math.max(1, newTotalCuotas);

    // Total a pagar = capital restante + (interés fijo × cuotas a generar)
    const totalInteres = interesPorCuota * cuotasAGenerar;
    const totalAPagar =
      Math.round((capitalRestante + totalInteres) * 100) / 100;

    const fechaInicio = new Date();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.update(
        PrestamoVersion,
        { id: versionActual.id },
        { fechaFin: fechaInicio },
      );

      for (const c of conSaldo) {
        await queryRunner.manager.update(Cuota, c.id, {
          saldoCuota: 0,
          estado: 'REFINANCIADA',
        });
      }

      // Redistribuir: capital restante + interés fijo por cuota
      const nuevaVersion = queryRunner.manager.create(PrestamoVersion, {
        prestamoId,
        frecuenciaPagoId: newFrecuenciaId,
        monto: capitalRestante,
        interesPorcentaje,
        plazoMeses: newPlazo,
        montoTotal: totalAPagar,
        fechaInicio,
      });
      const savedVersion = await queryRunner.manager.save(nuevaVersion);

      const cuotas = this.generarCuotasRedistribuidas(
        prestamoId,
        savedVersion.id,
        totalAPagar,
        cuotasAGenerar,
        frecuencia.cuotasPorMes,
        fechaInicio,
      );
      await queryRunner.manager.save(cuotas);

      await queryRunner.manager.save(HistorialPrestamo, {
        prestamoId,
        accion: 'MODIFICACION',
        estadoAnterior: versionActual.plazoMeses.toString(),
        estadoNuevo: `${newPlazo} meses, ${frecuencia.descripcion || frecuencia.codigo}`,
        observacion: `Refinanciado: capital restante $${capitalRestante.toLocaleString()} dividido en ${cuotasAGenerar} cuotas, interés fijo $${interesPorCuota.toLocaleString()}/cuota`,
      });

      await queryRunner.commitTransaction();
      return this.findOne(prestamoId, organizacionId);
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }
}
