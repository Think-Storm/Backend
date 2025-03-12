import { Test, TestingModule } from '@nestjs/testing';
import { CommonDataController } from '../../../../src/modules/common-data/common-data.controller';
import { CommonDataService } from '../../../../src/modules/common-data/common-data.service';
import { LanguageCode, LanguageName } from '@prisma/client';

describe('CommonDataController', () => {
  let controller: CommonDataController;
  let service: CommonDataService;

  const mockLanguages = [
    { code: LanguageCode.EN, name: LanguageName.English },
    { code: LanguageCode.KR, name: LanguageName.Korean },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommonDataController],
      providers: [
        {
          provide: CommonDataService,
          useValue: {
            getAllLanguages: jest.fn().mockResolvedValue(mockLanguages),
          },
        },
      ],
    }).compile();

    controller = module.get<CommonDataController>(CommonDataController);
    service = module.get<CommonDataService>(CommonDataService);
  });

  describe('getAllLanguages', () => {
    it('should return array of languages', async () => {
      const result = await controller.getAllLanguages();

      expect(service.getAllLanguages).toHaveBeenCalled();
      expect(result).toEqual(mockLanguages);
    });
  });
});
