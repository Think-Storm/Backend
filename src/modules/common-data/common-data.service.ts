import { Injectable, Logger } from '@nestjs/common';
import { CommonDataRepository } from './common-data.repository';
import { CommonDataMapper } from './dto/common-data.mapper';
import { errorMessages } from '../../common/enums/errorMessages';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { LanguageResponseDto } from './dto/commonDataResponse.dto';

@Injectable()
export class CommonDataService {
  private readonly logger = new Logger(CommonDataService.name);

  constructor(
    private commonDataRepository: CommonDataRepository,
    private commonDataMapper: CommonDataMapper,
  ) {}

  /**
   * Finds all languages
   * @returns A promise resolving to the LanguageResponseDto
   */

  async getAllLanguages(): Promise<LanguageResponseDto[]> {
    const fetchedLanguage = await this.commonDataRepository.getAllLanguages();

    if (!fetchedLanguage || fetchedLanguage.length === 0) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND_LANGUAGE,
      );
    }

    return this.commonDataMapper.mapLanguages(fetchedLanguage);
  }
}
