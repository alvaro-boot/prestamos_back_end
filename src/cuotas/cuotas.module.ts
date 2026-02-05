import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuotasService } from './cuotas.service';
import { CuotasController } from './cuotas.controller';
import { Cuota } from './entities/cuota.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cuota])],
  controllers: [CuotasController],
  providers: [CuotasService],
  exports: [CuotasService],
})
export class CuotasModule {}
