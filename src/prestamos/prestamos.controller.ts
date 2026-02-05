import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrestamosService } from './prestamos.service';
import { CreatePrestamoDto } from './dto/create-prestamo.dto';
import { UpdatePrestamoDto } from './dto/update-prestamo.dto';
import { CreatePagoDto } from '../pagos/dto/create-pago.dto';
import { CuotasService } from '../cuotas/cuotas.service';
import { PagosService } from '../pagos/pagos.service';
import { HistorialPrestamoService } from '../historial-prestamo/historial-prestamo.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Préstamos')
@ApiBearerAuth()
@Controller('prestamos')
export class PrestamosController {
  constructor(
    private readonly prestamosService: PrestamosService,
    private readonly cuotasService: CuotasService,
    private readonly pagosService: PagosService,
    private readonly historialService: HistorialPrestamoService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard: total prestado, cobrado e interés ganado' })
  async getDashboard(@CurrentUser() user: { id: number }) {
    return this.prestamosService.getDashboard(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar préstamos del usuario' })
  async findAll(
    @CurrentUser() user: { id: number },
    @Query('cliente_id') clienteIdStr?: string,
    @Query('estado') estado?: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const clienteId = clienteIdStr ? parseInt(clienteIdStr, 10) : undefined;
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    return this.prestamosService.findAll(
      user.id,
      clienteId,
      estado,
      page,
      limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener préstamo por ID' })
  async findOne(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.prestamosService.findOne(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear préstamo y generar cuotas' })
  async create(
    @CurrentUser() user: { id: number },
    @Body() dto: CreatePrestamoDto,
  ) {
    return this.prestamosService.create(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar estado del préstamo' })
  async update(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePrestamoDto,
  ) {
    return this.prestamosService.update(id, dto, user.id);
  }

  @Post(':id/saldar')
  @ApiOperation({ summary: 'Marcar préstamo como pagado' })
  async saldar(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.prestamosService.saldar(id, user.id);
  }

  @Get(':prestamoId/cuotas')
  @ApiOperation({ summary: 'Listar cuotas del préstamo' })
  async getCuotas(
    @CurrentUser() user: { id: number },
    @Param('prestamoId', ParseIntPipe) prestamoId: number,
    @Query('estado') estado?: string,
  ) {
    await this.prestamosService.findOne(prestamoId, user.id);
    return this.cuotasService.findByPrestamo(prestamoId, estado);
  }

  @Get(':prestamoId/pagos')
  @ApiOperation({ summary: 'Historial de pagos del préstamo' })
  async getPagos(
    @CurrentUser() user: { id: number },
    @Param('prestamoId', ParseIntPipe) prestamoId: number,
  ) {
    await this.prestamosService.findOne(prestamoId, user.id);
    return this.pagosService.findByPrestamo(prestamoId);
  }

  @Post(':prestamoId/pagos')
  @ApiOperation({ summary: 'Registrar pago y aplicar a cuotas' })
  async registrarPago(
    @CurrentUser() user: { id: number },
    @Param('prestamoId', ParseIntPipe) prestamoId: number,
    @Body() dto: CreatePagoDto,
  ) {
    await this.prestamosService.findOne(prestamoId, user.id);
    return this.pagosService.registrarPago(prestamoId, dto);
  }

  @Get(':prestamoId/historial')
  @ApiOperation({ summary: 'Historial de cambios del préstamo' })
  async getHistorial(
    @CurrentUser() user: { id: number },
    @Param('prestamoId', ParseIntPipe) prestamoId: number,
  ) {
    await this.prestamosService.findOne(prestamoId, user.id);
    return this.historialService.findByPrestamo(prestamoId);
  }
}
