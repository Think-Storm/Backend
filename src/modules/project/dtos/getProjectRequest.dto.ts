import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetProjectRequestDto {
  @ApiProperty({
    description: 'The ID of the project',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  id: number;
}
