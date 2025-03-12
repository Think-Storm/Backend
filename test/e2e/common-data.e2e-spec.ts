import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { LanguageCode, LanguageName } from '@prisma/client';
import { CommonDataRepository } from '../../src/modules/common-data/common-data.repository';
import { CommonDataModule } from '../../src/modules/common-data/common-data.module';
import { ConfigModule } from '@nestjs/config';

describe('CommonDataController (e2e)', () => {
  let app: INestApplication;

  const mockLanguages = [
    {
      code: LanguageCode.EN,
      name: LanguageName.English,
    },
    {
      code: LanguageCode.KR,
      name: LanguageName.Korean,
    },
  ];

  // Create a mock repository
  const mockCommonDataRepository = {
    getAllLanguages: jest.fn().mockImplementation(() => {
      return Promise.resolve(mockLanguages);
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), CommonDataModule],
    })
      .overrideProvider(CommonDataRepository)
      .useValue(mockCommonDataRepository)
      .compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('common-data');

    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/languages (GET)', () => {
    it('should return all languages', async () => {
      mockCommonDataRepository.getAllLanguages.mockResolvedValueOnce(
        mockLanguages,
      );

      return request(app.getHttpServer())
        .get('/common-data/languages')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(
            expect.arrayContaining(
              mockLanguages.map((lang) => ({
                code: lang.code,
                name: lang.name,
              })),
            ),
          );
          expect(res.body).toHaveLength(mockLanguages.length);
        });
    });

    it('should throw 404 when no languages exist', async () => {
      mockCommonDataRepository.getAllLanguages.mockResolvedValueOnce([]);

      return request(app.getHttpServer())
        .get('/common-data/languages')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe('language was not found.');
        });
    });

    it('should handle database errors gracefully', async () => {
      mockCommonDataRepository.getAllLanguages.mockRejectedValueOnce(
        new Error('Database error'),
      );

      return request(app.getHttpServer())
        .get('/common-data/languages')
        .expect(500);
    });
  });
});
