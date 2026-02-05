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

  private getOrgId(user: { usuario: { id: number; organizacionId: number | null } }) {
    return user.usuario.organizacionId ?? user.usuario.id;
  }

  @Get()
  @Roles('ADMIN', 'COBRADOR', 'CONSULTA')
  @ApiOperation({ summary: 'Listar clientes de mi organización' })
  async findAll(
    @CurrentUser() user: { usuario: { id: number; organizacionId: number | null } },
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    return this.clientesService.findAll(this.getOrgId(user), page, limit, search);
  }

  @Get(':id')
  @Roles('ADMIN', 'COBRADOR', 'CONSULTA')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  async findOne(
    @CurrentUser() user: { usuario: { id: number; organizacionId: number | null } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientesService.findOne(id, this.getOrgId(user));
  }

  @Post()
  @Roles('ADMIN', 'COBRADOR')
  @ApiOperation({ summary: 'Crear cliente' })
  async create(
    @CurrentUser() user: { usuario: { id: number; organizacionId: number | null } },
    @Body() dto: CreateClienteDto,
  ) {
    return this.clientesService.create(dto, this.getOrgId(user));
  }

  @Patch(':id')
  @Roles('ADMIN', 'COBRADOR')
  @ApiOperation({ summary: 'Actualizar cliente' })
  async update(
    @CurrentUser() user: { usuario: { id: number; organizacionId: number | null } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.clientesService.update(id, dto, this.getOrgId(user));
  }

  @Delete(':id')
  @Roles('ADMIN', 'COBRADOR')
  @ApiOperation({ summary: 'Eliminar cliente' })
  async remove(
    @CurrentUser() user: { usuario: { id: number; organizacionId: number | null } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.clientesService.remove(id, this.getOrgId(user));
  }
}
