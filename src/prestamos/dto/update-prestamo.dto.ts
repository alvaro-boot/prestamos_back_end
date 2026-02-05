import {
  IsEnum,
  IsOptional,
  IsNumber,
  IsPositive,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePrestamoDto {
  @ApiPropertyOptional({
    enum: ['ACTIVO', 'CANCELADO', 'REFINANCIADO', 'PAGADO'],
  })
  @IsEnum(['ACTIVO', 'CANCELADO', 'REFINANCIADO', 'PAGADO'])
  @IsOptional()
  estado?: string;

  @ApiPropertyOptional({ description: 'Nuevo plazo en meses' })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  plazo_meses?: number;

  @ApiPropertyOptional({ description: 'Nueva frecuencia de pago (ID)' })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  frecuencia_pago_id?: number;
}
