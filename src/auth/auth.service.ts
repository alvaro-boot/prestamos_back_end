import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const usuario = await this.usuariosService.register(registerDto);
    return this.login({
      email: registerDto.email,
      password: registerDto.password,
    });
  }

  async login(loginDto: LoginDto) {
    const usuario = await this.usuariosService.findByEmail(loginDto.email);
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      usuario.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (!usuario.activo) {
      throw new UnauthorizedException('Usuario inactivo');
    }
    const roles = usuario.roles?.map((r) => r.codigo) || [];
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      roles,
    };
    const accessToken = this.jwtService.sign(payload);
    const { passwordHash, ...usuarioSinPassword } = usuario;
    return {
      access_token: accessToken,
      usuario: usuarioSinPassword,
      roles,
    };
  }
}
