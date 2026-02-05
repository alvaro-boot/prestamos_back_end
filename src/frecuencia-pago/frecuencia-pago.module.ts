import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FrecuenciaPagoService } from './frecuencia-pago.service';
import { FrecuenciaPagoController } from './frecuencia-pago.controller';
import { FrecuenciaPago } from './entities/frecuencia-pago.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FrecuenciaPago])],
  controllers: [FrecuenciaPagoController],
  providers: [FrecuenciaPagoService],
  exports: [FrecuenciaPagoService],
})
export class FrecuenciaPagoModule {}
