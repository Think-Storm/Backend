import { Test, TestingModule } from '@nestjs/testing';
import { CommonDataService } from '../../../../src/modules/common-data/common-data.service';
import { CommonDataRepository } from '../../../../src/modules/common-data/common-data.repository';
import { CommonDataMapper } from '../../../../src/modules/common-data/dto/common-data.mapper';
import { LanguageCode, LanguageName } from '@think-storm/contracts';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../../../src/common/enums/errorMessages';

describe('CommonDataService', () => {
  let service: CommonDataService;
  let repository: CommonDataRepository;
  let mapper: CommonDataMapper;

  const mockRawLanguages = [
    { code: 'EN', name: 'English' },
    { code: 'KR', name: 'Korean' },
  ];

  const mockMappedLanguages = [
    { code: LanguageCode.EN, name: LanguageName.English },
    { code: LanguageCode.KR, name: LanguageName.Korean },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommonDataService,
        {
          provide: CommonDataRepository,
          useValue: {
            getAllLanguages: jest.fn().mockResolvedValue(mockRawLanguages),
          },
        },
        {
          provide: CommonDataMapper,
          useValue: {
            mapLanguages: jest.fn().mockReturnValue(mockMappedLanguages),
          },
        },
      ],
    }).compile();

    service = module.get<CommonDataService>(CommonDataService);
    repository = module.get<CommonDataRepository>(CommonDataRepository);
    mapper = module.get<CommonDataMapper>(CommonDataMapper);
  });

  describe('getAllLanguages', () => {
    it('should return mapped languages array', async () => {
      const result = await service.getAllLanguages();

      expect(repository.getAllLanguages).toHaveBeenCalled();
      expect(mapper.mapLanguages).toHaveBeenCalledWith(mockRawLanguages);
      expect(result).toEqual(mockMappedLanguages);
    });

    it('should throw error when no languages found', async () => {
      jest.spyOn(repository, 'getAllLanguages').mockResolvedValue([]);

      await expect(service.getAllLanguages()).rejects.toThrow(
        ServiceException.EntityNotFoundException(
          errorMessages.ENTITY_NOT_FOUND_LANGUAGE,
        ),
      );
    });

    it('should throw error when repository fails', async () => {
      jest
        .spyOn(repository, 'getAllLanguages')
        .mockRejectedValue(new Error('DB Error'));

      await expect(service.getAllLanguages()).rejects.toThrow('DB Error');
    });
  });
});
