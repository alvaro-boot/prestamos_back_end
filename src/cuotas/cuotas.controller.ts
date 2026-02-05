import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CuotasService } from './cuotas.service';

@ApiTags('Cuotas')
@ApiBearerAuth()
@Controller('cuotas')
export class CuotasController {
  constructor(private readonly cuotasService: CuotasService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cuota por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cuotasService.findOne(id);
  }
}
