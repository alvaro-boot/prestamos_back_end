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
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { AsignarRolesDto } from './dto/asignar-roles.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
@Roles('ADMIN')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios (solo ADMIN)' })
  async findAll(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    return this.usuariosService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const usuario = await this.usuariosService.findById(id);
    if (!usuario) return { error: 'Usuario no encontrado' };
    const { passwordHash, ...result } = usuario;
    return result;
  }

  @Post()
  @ApiOperation({ summary: 'Crear usuario' })
  async create(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.update(id, dto);
  }

  @Patch(':id/roles')
  @ApiOperation({ summary: 'Asignar roles al usuario' })
  async asignarRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarRolesDto,
  ) {
    return this.usuariosService.asignarRoles(id, dto);
  }
}
