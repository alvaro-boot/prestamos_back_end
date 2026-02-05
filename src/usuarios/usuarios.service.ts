import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from './entities/usuario.entity';
import { Rol } from '../roles/entities/rol.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { AsignarRolesDto } from './dto/asignar-roles.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Rol)
    private rolRepo: Repository<Rol>,
  ) {}

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.usuarioRepo.findOne({
      where: { email },
      relations: ['roles'],
    });
  }

  async findById(id: number): Promise<Usuario | null> {
    return this.usuarioRepo.findOne({
      where: { id },
      relations: ['roles'],
    });
  }

  async findAll(page = 1, limit = 10) {
    const [items, total] = await this.usuarioRepo.findAndCount({
      relations: ['roles'],
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
    });
    return { items, total, page, limit };
  }

  async create(dto: CreateUsuarioDto) {
    const existente = await this.findByEmail(dto.email);
    if (existente) {
      throw new ConflictException('El email ya está registrado');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const { rol_ids, ...rest } = dto;
    const usuario = this.usuarioRepo.create({
      ...rest,
      passwordHash,
    });
    const saved = await this.usuarioRepo.save(usuario);
    const roleIds = (rol_ids || []).map((id) => Number(id)).filter((id) => !isNaN(id));
    if (roleIds.length > 0) {
      const roles = await this.rolRepo.find({ where: { id: In(roleIds) } });
      saved.roles = roles;
      await this.usuarioRepo.save(saved);
    } else {
      const rolCobrador = await this.rolRepo.findOne({
        where: { codigo: 'COBRADOR' },
      });
      if (rolCobrador) {
        saved.roles = [rolCobrador];
        await this.usuarioRepo.save(saved);
      }
    }
    const usuarioCreado = await this.findById(saved.id);
    if (!usuarioCreado) return saved;
    const { passwordHash: _p, ...result } = usuarioCreado;
    return result;
  }

  async register(dto: { email: string; password: string; nombre?: string }) {
    const existente = await this.findByEmail(dto.email);
    if (existente) {
      throw new ConflictException('El email ya está registrado');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const rolCobrador = await this.rolRepo.findOne({
      where: { codigo: 'COBRADOR' },
    });
    const usuario = this.usuarioRepo.create({
      email: dto.email,
      passwordHash,
      nombre: dto.nombre,
      activo: true,
      roles: rolCobrador ? [rolCobrador] : [],
    });
    return this.usuarioRepo.save(usuario);
  }

  async update(id: number, dto: UpdateUsuarioDto) {
    const usuario = await this.findById(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    if (dto.email && dto.email !== usuario.email) {
      const existente = await this.findByEmail(dto.email);
      if (existente) throw new ConflictException('El email ya está registrado');
    }
    if (dto.password) {
      (dto as Record<string, unknown>).passwordHash = await bcrypt.hash(
        dto.password,
        10,
      );
      delete (dto as Record<string, unknown>).password;
    }
    await this.usuarioRepo.update(id, dto as Partial<Usuario>);
    return this.findById(id);
  }

  async asignarRoles(id: number, dto: AsignarRolesDto) {
    const usuario = await this.findById(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    const roles = await this.rolRepo.find({ where: { id: In(dto.rol_ids) } });
    usuario.roles = roles;
    await this.usuarioRepo.save(usuario);
    return this.findById(id);
  }
}
