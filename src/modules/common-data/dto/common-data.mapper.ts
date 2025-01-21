import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { LanguageResponseDto, LanguageWithCodeAndName } from './language.dto';

@Injectable()
export class CommonDataMapper {
  /**
   * Maps language data to response DTO
   * @param languages Array of languages with code and name
   * @returns Array of language response DTOs
   */
  @ApiProperty({ type: LanguageResponseDto })
  mapLanguages(languages: LanguageWithCodeAndName[]): LanguageResponseDto[] {
    return languages.map((language) => ({
      code: language.code,
      name: language.name,
    }));
  }
}
