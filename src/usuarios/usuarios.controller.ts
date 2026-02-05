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
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
@Roles('ADMIN')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios de mi organización (solo ADMIN)' })
  async findAll(
    @CurrentUser() user: { usuario: { id: number; organizacionId: number | null } },
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const orgId = user.usuario.organizacionId ?? user.usuario.id;
    return this.usuariosService.findAll(orgId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  async findOne(
    @CurrentUser() user: { usuario: { id: number; organizacionId: number | null } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const orgId = user.usuario.organizacionId ?? user.usuario.id;
    const usuario = await this.usuariosService.findById(id);
    if (!usuario) return { error: 'Usuario no encontrado' };
    if (usuario.organizacionId !== orgId) return { error: 'Usuario no encontrado' };
    const { passwordHash, ...result } = usuario;
    return result;
  }

  @Post()
  @ApiOperation({ summary: 'Crear cobrador en mi organización' })
  async create(
    @CurrentUser() user: { usuario: { id: number; organizacionId: number | null } },
    @Body() dto: CreateUsuarioDto,
  ) {
    const orgId = user.usuario.organizacionId ?? user.usuario.id;
    return this.usuariosService.create(dto, orgId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario' })
  async update(
    @CurrentUser() user: { usuario: { id: number; organizacionId: number | null } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
  ) {
    const orgId = user.usuario.organizacionId ?? user.usuario.id;
    await this.usuariosService.verifyOrganizacion(id, orgId);
    return this.usuariosService.update(id, dto);
  }

  @Patch(':id/roles')
  @ApiOperation({ summary: 'Asignar roles al usuario' })
  async asignarRoles(
    @CurrentUser() user: { usuario: { id: number; organizacionId: number | null } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarRolesDto,
  ) {
    const orgId = user.usuario.organizacionId ?? user.usuario.id;
    await this.usuariosService.verifyOrganizacion(id, orgId);
    return this.usuariosService.asignarRoles(id, dto);
  }
}
