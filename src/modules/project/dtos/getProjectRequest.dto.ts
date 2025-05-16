import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GetProject } from '@think-storm/contracts';

export class GetProjectRequestDto implements GetProject {
  @ApiProperty({
    description: 'The ID of the project',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  id: number;
}
