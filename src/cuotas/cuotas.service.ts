import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cuota } from './entities/cuota.entity';

@Injectable()
export class CuotasService {
  constructor(
    @InjectRepository(Cuota)
    private cuotaRepo: Repository<Cuota>,
  ) {}

  async findByPrestamo(prestamoId: number, estado?: string) {
    const qb = this.cuotaRepo
      .createQueryBuilder('c')
      .where('c.prestamoId = :prestamoId', { prestamoId })
      .orderBy('c.numeroCuota', 'ASC');
    if (estado) qb.andWhere('c.estado = :estado', { estado });
    return qb.getMany();
  }

  async findOne(id: number) {
    const cuota = await this.cuotaRepo.findOne({
      where: { id },
      relations: ['prestamo', 'prestamoVersion'],
    });
    if (!cuota) throw new NotFoundException('Cuota no encontrada');
    return cuota;
  }
}
