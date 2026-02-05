import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepo: Repository<Cliente>,
  ) {}

  async findAll(organizacionId: number, page = 1, limit = 10, search?: string) {
    const qb = this.clienteRepo
      .createQueryBuilder('c')
      .where('c.organizacionId = :organizacionId', { organizacionId });
    if (search) {
      qb.andWhere('(c.documento LIKE :search OR c.nombre LIKE :search)', {
        search: `%${search}%`,
      });
    }
    const [items, total] = await qb
      .orderBy('c.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: number, organizacionId: number) {
    const cliente = await this.clienteRepo.findOne({
      where: { id, organizacionId },
      relations: ['prestamos'],
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return cliente;
  }

  async create(dto: CreateClienteDto, organizacionId: number) {
    const existente = await this.clienteRepo.findOne({
      where: { documento: dto.documento, organizacionId },
    });
    if (existente) {
      throw new ConflictException('El documento ya está registrado');
    }
    const cliente = this.clienteRepo.create({ ...dto, organizacionId });
    return this.clienteRepo.save(cliente);
  }

  async update(id: number, dto: UpdateClienteDto, organizacionId: number) {
    const cliente = await this.clienteRepo.findOne({
      where: { id, organizacionId },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    if (dto.documento && dto.documento !== cliente.documento) {
      const existente = await this.clienteRepo.findOne({
        where: { documento: dto.documento, organizacionId },
      });
      if (existente)
        throw new ConflictException('El documento ya está registrado');
    }
    await this.clienteRepo.update({ id, organizacionId }, dto);
    return this.clienteRepo.findOne({ where: { id } });
  }

  async remove(id: number, organizacionId: number) {
    const cliente = await this.findOne(id, organizacionId);
    const prestamosActivos = cliente.prestamos?.filter(
      (p) => p.estado === 'ACTIVO',
    );
    if (prestamosActivos?.length) {
      throw new ConflictException(
        'No se puede eliminar: el cliente tiene préstamos activos',
      );
    }
    await this.clienteRepo
      .softDelete(id)
      .catch(() => this.clienteRepo.delete(id));
    return { message: 'Cliente eliminado' };
  }
}
