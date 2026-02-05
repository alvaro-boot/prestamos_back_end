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
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Préstamos')
@ApiBearerAuth()
@Controller('prestamos')
export class PrestamosController {
  private getOrgId(user: { usuario: { id: number; organizacionId: number | null } }) {
    return user.usuario.organizacionId ?? user.usuario.id;
  }

  constructor(
    private readonly prestamosService: PrestamosService,
    private readonly cuotasService: CuotasService,
    private readonly pagosService: PagosService,
    private readonly historialService: HistorialPrestamoService,
  ) {}

  @Get('dashboard')
  @Roles('ADMIN', 'COBRADOR', 'CONSULTA')
  @ApiOperation({ summary: 'Dashboard: total prestado, cobrado e interés ganado' })
  async getDashboard(@CurrentUser() user: { usuario: { id: number; organizacionId: number | null } }) {
    return this.prestamosService.getDashboard(this.getOrgId(user));
  }

  @Get()
  @Roles('ADMIN', 'COBRADOR', 'CONSULTA')
  @ApiOperation({ summary: 'Listar préstamos de mi organización' })
  async findAll(
    @CurrentUser() user: { usuario: { id: number; organizacionId: number | null } },
    @Query('cliente_id') clienteIdStr?: string,
    @Query('estado') estado?: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const clienteId = clienteIdStr ? parseInt(clienteIdStr, 10) : undefined;
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    return this.prestamosService.findAll(
      this.getOrgId(user),
      clienteId,
      estado,
      page,
      limit,
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'COBRADOR', 'CONSULTA')
  @ApiOperation({ summary: 'Obtener préstamo por ID' })
  async findOne(
    @CurrentUser() user: { usuario: { id: number; organizacionId: number | null } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.prestamosService.findOne(id, this.getOrgId(user));
  }

  @Post()
  @Roles('ADMIN', 'COBRADOR')
  @ApiOperation({ summary: 'Crear préstamo y generar cuotas' })
  async create(
    @CurrentUser() user: { usuario: { id: number; organizacionId: number | null } },
    @Body() dto: CreatePrestamoDto,
  ) {
    return this.prestamosService.create(dto, this.getOrgId(user));
  }

  @Patch(':id')
  @Roles('ADMIN', 'COBRADOR')
  @ApiOperation({ summary: 'Actualizar estado del préstamo' })
  async update(
    @CurrentUser() user: { usuario: { id: number; organizacionId: number | null } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePrestamoDto,
  ) {
    return this.prestamosService.update(id, dto, this.getOrgId(user));
  }

  @Post(':id/saldar')
  @Roles('ADMIN', 'COBRADOR')
  @ApiOperation({ summary: 'Marcar préstamo como pagado' })
  async saldar(
    @CurrentUser() user: { usuario: { id: number; organizacionId: number | null } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.prestamosService.saldar(id, this.getOrgId(user));
  }

  @Get(':prestamoId/cuotas')
  @Roles('ADMIN', 'COBRADOR', 'CONSULTA')
  @ApiOperation({ summary: 'Listar cuotas del préstamo' })
  async getCuotas(
    @CurrentUser() user: { usuario: { id: number; organizacionId: number | null } },
    @Param('prestamoId', ParseIntPipe) prestamoId: number,
    @Query('estado') estado?: string,
  ) {
    await this.prestamosService.findOne(prestamoId, this.getOrgId(user));
    return this.cuotasService.findByPrestamo(prestamoId, estado);
  }

  @Get(':prestamoId/pagos')
  @Roles('ADMIN', 'COBRADOR', 'CONSULTA')
  @ApiOperation({ summary: 'Historial de pagos del préstamo' })
  async getPagos(
    @CurrentUser() user: { usuario: { id: number; organizacionId: number | null } },
    @Param('prestamoId', ParseIntPipe) prestamoId: number,
  ) {
    await this.prestamosService.findOne(prestamoId, this.getOrgId(user));
    return this.pagosService.findByPrestamo(prestamoId);
  }

  @Post(':prestamoId/pagos')
  @Roles('ADMIN', 'COBRADOR')
  @ApiOperation({ summary: 'Registrar pago y aplicar a cuotas' })
  async registrarPago(
    @CurrentUser() user: { usuario: { id: number; organizacionId: number | null } },
    @Param('prestamoId', ParseIntPipe) prestamoId: number,
    @Body() dto: CreatePagoDto,
  ) {
    await this.prestamosService.findOne(prestamoId, this.getOrgId(user));
    return this.pagosService.registrarPago(prestamoId, dto);
  }

  @Get(':prestamoId/historial')
  @Roles('ADMIN', 'COBRADOR', 'CONSULTA')
  @ApiOperation({ summary: 'Historial de cambios del préstamo' })
  async getHistorial(
    @CurrentUser() user: { usuario: { id: number; organizacionId: number | null } },
    @Param('prestamoId', ParseIntPipe) prestamoId: number,
  ) {
    await this.prestamosService.findOne(prestamoId, this.getOrgId(user));
    return this.historialService.findByPrestamo(prestamoId);
  }
}
