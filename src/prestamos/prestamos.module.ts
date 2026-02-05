import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrestamosService } from './prestamos.service';
import { PrestamosController } from './prestamos.controller';
import { Prestamo } from './entities/prestamo.entity';
import { PrestamoVersion } from '../prestamo-versiones/entities/prestamo-version.entity';
import { Cuota } from '../cuotas/entities/cuota.entity';
import { HistorialPrestamo } from '../historial-prestamo/entities/historial-prestamo.entity';
import { FrecuenciaPago } from '../frecuencia-pago/entities/frecuencia-pago.entity';
import { Cliente } from '../clientes/entities/cliente.entity';
import { CuotasModule } from '../cuotas/cuotas.module';
import { PagosModule } from '../pagos/pagos.module';
import { HistorialPrestamoModule } from '../historial-prestamo/historial-prestamo.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Prestamo,
      PrestamoVersion,
      Cuota,
      HistorialPrestamo,
      FrecuenciaPago,
      Cliente,
    ]),
    CuotasModule,
    PagosModule,
    HistorialPrestamoModule,
  ],
  controllers: [PrestamosController],
  providers: [PrestamosService],
  exports: [PrestamosService],
})
export class PrestamosModule {}
