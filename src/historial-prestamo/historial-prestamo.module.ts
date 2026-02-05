import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistorialPrestamoService } from './historial-prestamo.service';
import { HistorialPrestamo } from './entities/historial-prestamo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HistorialPrestamo])],
  providers: [HistorialPrestamoService],
  exports: [HistorialPrestamoService],
})
export class HistorialPrestamoModule {}
