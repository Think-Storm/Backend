import { instanceToPlain, plainToInstance } from 'class-transformer';
import { LanguageResponseDto } from './commonDataResponse.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CommonDataMapper {
  /**
   * Maps a Language entity to a CommonDataResponseDto
   * @returns A CommonDataResponseDto with the mapped data
   */
  @ApiProperty({ type: LanguageResponseDto })
  mapLanguages(
    languages: { code: string; name: string }[],
  ): LanguageResponseDto[] {
    return languages.map((language) =>
      plainToInstance(LanguageResponseDto, instanceToPlain(language), {
        excludeExtraneousValues: true,
      }),
    );
  }
}
