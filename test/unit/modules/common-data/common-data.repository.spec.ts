import { Test, TestingModule } from '@nestjs/testing';
import { CommonDataRepository } from '../../../../src/modules/common-data/common-data.repository';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { LanguageCode, LanguageName } from '@prisma/client';

describe('CommonDataRepository', () => {
  let repository: CommonDataRepository;
  let prisma: PrismaService;

  const mockLanguages = [
    { code: LanguageCode.EN, name: LanguageName.English },
    { code: LanguageCode.KR, name: LanguageName.Korean },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommonDataRepository,
        {
          provide: PrismaService,
          useValue: {
            language: {
              findMany: jest.fn().mockResolvedValue(mockLanguages),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<CommonDataRepository>(CommonDataRepository);
    prisma = module.get<PrismaService>(PrismaService);

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAllLanguages', () => {
    it('should return all languages', async () => {
      const result = await repository.getAllLanguages();
      expect(result).toEqual(mockLanguages);
      expect(prisma.language.findMany).toHaveBeenCalledWith({
        select: {
          code: true,
          name: true,
        },
      });
    });

    it('should handle database errors', async () => {
      jest
        .spyOn(prisma.language, 'findMany')
        .mockRejectedValue(new Error('Error fetching languages:'));
      await expect(repository.getAllLanguages()).rejects.toThrow(
        'Error fetching languages:',
      );
    });
  });
});
