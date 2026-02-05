import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Rol } from '../roles/entities/rol.entity';
import { FrecuenciaPago } from '../frecuencia-pago/entities/frecuencia-pago.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import * as bcrypt from 'bcrypt';

@Module({
  imports: [TypeOrmModule.forFeature([Rol, FrecuenciaPago, Usuario])],
})
export class DatabaseModule implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    await this.seedRoles();
    await this.seedFrecuenciaPago();
    await this.seedAdminUser();
  }

  private async seedRoles() {
    const rolRepo = this.dataSource.getRepository(Rol);
    const registros = [
      { codigo: 'ADMIN', descripcion: 'Administrador' },
      { codigo: 'COBRADOR', descripcion: 'Cobrador' },
      { codigo: 'CONSULTA', descripcion: 'Solo consulta' },
    ];
    for (const reg of registros) {
      const existe = await rolRepo.findOne({ where: { codigo: reg.codigo } });
      if (!existe) {
        await rolRepo.save(reg);
      }
    }
  }

  private async seedFrecuenciaPago() {
    const fpRepo = this.dataSource.getRepository(FrecuenciaPago);
    const registros = [
      { codigo: 'MENSUAL', descripcion: 'Mensual', cuotasPorMes: 1 },
      { codigo: 'QUINCENAL', descripcion: 'Quincenal', cuotasPorMes: 2 },
    ];
    for (const reg of registros) {
      const existe = await fpRepo.findOne({ where: { codigo: reg.codigo } });
      if (!existe) {
        await fpRepo.save(reg);
      }
    }
  }

  private async seedAdminUser() {
    const usuarioRepo = this.dataSource.getRepository(Usuario);
    const admin = await usuarioRepo.findOne({
      where: { email: 'admin@ejemplo.com' },
    });
    if (!admin) {
      const adminRol = await this.dataSource
        .getRepository(Rol)
        .findOne({ where: { codigo: 'ADMIN' } });
      const usuario = usuarioRepo.create({
        email: 'admin@ejemplo.com',
        passwordHash: await bcrypt.hash('admin123', 10),
        nombre: 'Administrador',
        activo: true,
        roles: adminRol ? [adminRol] : [],
      });
      await usuarioRepo.save(usuario);
    }
  }
}
