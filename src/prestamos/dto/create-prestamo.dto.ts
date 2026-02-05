import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsDateString,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrestamoDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  cliente_id: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  monto: number;

  @ApiProperty({
    description: 'Tasa de interés mensual en % (ej: 10 = 10% por mes)',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  interes_porcentaje: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  plazo_meses: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  frecuencia_pago_id: number;

  @ApiProperty({ example: '2025-02-01' })
  @IsDateString()
  @IsNotEmpty()
  fecha_inicio: string;

  @ApiPropertyOptional({
    description:
      'Valor fijo por cuota (ej: redondear 78000 a 80000). Si no se envía, se calcula automáticamente.',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  monto_cuota?: number;
}
