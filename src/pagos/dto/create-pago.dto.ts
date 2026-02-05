import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsPositive,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreatePagoDto {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  monto_pagado: number;

  @ApiPropertyOptional({
    description:
      'Si es true, el abono se aplica a la última cuota (la más lejana). Si es false, a la primera pendiente.',
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  es_abono?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  metodo_pago?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  referencia?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  observacion?: string;
}
