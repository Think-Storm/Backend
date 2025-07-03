import {
  LanguageCode,
  LanguageName,
  LanguageResponse,
} from '@think-storm/contracts';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

/**
 * A DTO class that represents the response of a language
 */
export class LanguageResponseDto implements LanguageResponse {
  @Expose()
  @IsNotEmpty()
  @IsEnum(LanguageCode)
  @ApiProperty({
    example: LanguageCode.EN,
    description: 'The ISO code of the language',
    enum: LanguageCode,
    enumName: 'LanguageCode',
  })
  code: LanguageCode;

  @Expose()
  @IsNotEmpty()
  @IsEnum(LanguageName)
  @ApiProperty({
    example: LanguageName.English,
    description: 'The full name of the language',
    enum: LanguageName,
    enumName: 'LanguageName',
  })
  name: LanguageName;
}
