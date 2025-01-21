import { Language } from '@prisma/client';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { CommonDataResponseDto } from './commonDataResponse.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CommonDataMapper {
  /**
   * Maps a Language entity to a CommonDataResponseDto
   * @returns A CommonDataResponseDto with the mapped data
   */
  @ApiProperty({ type: CommonDataResponseDto })
  commonDataToCommonDataResponseDto(
    languages: Language[],
  ): CommonDataResponseDto[] {
    return languages.map((language) =>
      plainToInstance(CommonDataResponseDto, instanceToPlain(language), {
        excludeExtraneousValues: true,
      }),
    );
  }
}
