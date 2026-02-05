import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Clientes')
@ApiBearerAuth()
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  @Roles('ADMIN', 'COBRADOR', 'CONSULTA')
  @ApiOperation({ summary: 'Listar clientes del usuario' })
  async findAll(
    @CurrentUser() user: { id: number },
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    return this.clientesService.findAll(user.id, page, limit, search);
  }

  @Get(':id')
  @Roles('ADMIN', 'COBRADOR', 'CONSULTA')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  async findOne(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientesService.findOne(id, user.id);
  }

  @Post()
  @Roles('ADMIN', 'COBRADOR')
  @ApiOperation({ summary: 'Crear cliente' })
  async create(
    @CurrentUser() user: { id: number },
    @Body() dto: CreateClienteDto,
  ) {
    return this.clientesService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'COBRADOR')
  @ApiOperation({ summary: 'Actualizar cliente' })
  async update(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.clientesService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles('ADMIN', 'COBRADOR')
  @ApiOperation({ summary: 'Eliminar cliente' })
  async remove(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientesService.remove(id, user.id);
  }
}
