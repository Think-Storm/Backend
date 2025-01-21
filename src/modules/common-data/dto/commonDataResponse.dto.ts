import { Language, LanguageCode } from '@prisma/client';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CommonDataResponseDto {
  @Expose()
  @ApiProperty({
    example: 'EN',
    description: 'The code of the language',
    enum: LanguageCode,
  })
  code: LanguageCode;

  @Expose()
  @ApiProperty({
    example: 'English',
    description: 'The name of the language',
  })
  name: Language;

  @Expose()
  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'The creation date of the language',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    example: '2023-01-02T00:00:00.000Z',
    description: 'The last update date of the language',
  })
  lastUpdatedAt: Date;
}
