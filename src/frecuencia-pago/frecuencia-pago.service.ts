import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FrecuenciaPago } from './entities/frecuencia-pago.entity';

@Injectable()
export class FrecuenciaPagoService {
  constructor(
    @InjectRepository(FrecuenciaPago)
    private repo: Repository<FrecuenciaPago>,
  ) {}

  async findAll(): Promise<FrecuenciaPago[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<FrecuenciaPago | null> {
    return this.repo.findOne({ where: { id } });
  }
}
