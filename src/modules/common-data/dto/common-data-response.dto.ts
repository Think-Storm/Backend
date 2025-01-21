import { ApiProperty } from '@nestjs/swagger';

export class CommonDataResponseDto {
  @ApiProperty({ description: 'Code identifier', example: 'EN' })
  code: string;

  @ApiProperty({ description: 'Name value', example: 'English' })
  name: string;
}
