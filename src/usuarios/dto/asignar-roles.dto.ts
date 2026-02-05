import { IsArray, IsNumber, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AsignarRolesDto {
  @ApiProperty({ type: [Number], example: [1, 2] })
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  rol_ids: number[];
}
