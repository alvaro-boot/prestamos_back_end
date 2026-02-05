import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsArray,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUsuarioDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  activo?: boolean;

  @ApiPropertyOptional({
    description: 'IDs de roles a asignar (ej: [2] para COBRADOR). Si no se envía, se asigna COBRADOR.',
    type: [Number],
    example: [2],
  })
  @IsOptional()
  @IsArray()
  rol_ids?: number[];
}
