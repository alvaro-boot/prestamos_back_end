import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistorialPrestamo } from './entities/historial-prestamo.entity';

@Injectable()
export class HistorialPrestamoService {
  constructor(
    @InjectRepository(HistorialPrestamo)
    private repo: Repository<HistorialPrestamo>,
  ) {}

  async findByPrestamo(prestamoId: number) {
    return this.repo.find({
      where: { prestamoId },
      order: { fechaRegistro: 'DESC' },
    });
  }
}
