import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { RolesModule } from './roles/roles.module';
import { ClientesModule } from './clientes/clientes.module';
import { FrecuenciaPagoModule } from './frecuencia-pago/frecuencia-pago.module';
import { PrestamosModule } from './prestamos/prestamos.module';
import { CuotasModule } from './cuotas/cuotas.module';
import { PagosModule } from './pagos/pagos.module';
import { HistorialPrestamoModule } from './historial-prestamo/historial-prestamo.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    UsuariosModule,
    RolesModule,
    ClientesModule,
    FrecuenciaPagoModule,
    PrestamosModule,
    CuotasModule,
    PagosModule,
    HistorialPrestamoModule,
  ],
})
export class AppModule {}
