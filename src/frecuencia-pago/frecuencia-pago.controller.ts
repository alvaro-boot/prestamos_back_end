import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FrecuenciaPagoService } from './frecuencia-pago.service';

@ApiTags('Frecuencia Pago')
@ApiBearerAuth()
@Controller('frecuencia-pago')
export class FrecuenciaPagoController {
  constructor(private readonly frecuenciaPagoService: FrecuenciaPagoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar catálogo de frecuencias de pago' })
  async findAll() {
    return this.frecuenciaPagoService.findAll();
  }
}
