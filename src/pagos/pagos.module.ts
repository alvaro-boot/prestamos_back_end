import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosService } from './pagos.service';
import { Pago } from './entities/pago.entity';
import { Cuota } from '../cuotas/entities/cuota.entity';
import { Prestamo } from '../prestamos/entities/prestamo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pago, Cuota, Prestamo])],
  providers: [PagosService],
  exports: [PagosService],
})
export class PagosModule {}
