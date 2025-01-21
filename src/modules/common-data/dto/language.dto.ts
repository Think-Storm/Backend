import { Prisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

// Define a Prisma partial type for Language with only code and name
export type LanguageWithCodeAndName = Prisma.LanguageGetPayload<{
  select: {
    code: true;
    name: true;
  };
}>;

// DTO for language response
export class LanguageResponseDto {
  @ApiProperty({ description: 'Language code', example: 'EN' })
  code: string;

  @ApiProperty({ description: 'Language name', example: 'English' })
  name: string;
}
