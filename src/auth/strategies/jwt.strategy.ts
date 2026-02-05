import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuariosService } from '../../usuarios/usuarios.service';

export interface JwtPayload {
  sub: number;
  email: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private usuariosService: UsuariosService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'clave_secreta_default',
    });
  }

  async validate(payload: JwtPayload) {
    const usuario = await this.usuariosService.findById(payload.sub);
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Usuario no válido o inactivo');
    }
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
      usuario,
    };
  }
}
