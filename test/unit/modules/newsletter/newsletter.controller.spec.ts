import { Test, TestingModule } from '@nestjs/testing';
import { NewsletterController } from '../../../../src/modules/newsletter/newsletter.controller';
import { NewsletterService } from '../../../../src/modules/newsletter/newsletter.service';
import { NewsletterRepository } from '../../../../src/modules/newsletter/newsletter.repository';
import { NewsletterMapper } from '../../../../src/modules/newsletter/dtos/newsletter.mapper';
import {
  defaultCreateNewsletterSubscriptionDto,
  defaultNewsletterSubscriptionResponseDto,
} from '../../../utils/newsletter.utils';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../src/prisma/prisma.service';

describe('NewsletterController', () => {
  let newsletterController: NewsletterController;
  let newsletterService: NewsletterService;
  const prismaClient = new PrismaClient();

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prismaClient)],
      controllers: [NewsletterController],
      providers: [
        NewsletterService,
        NewsletterRepository,
        NewsletterMapper,
        PrismaService,
        ConfigService,
      ],
    }).compile();

    newsletterController = app.get<NewsletterController>(NewsletterController);
    newsletterService = app.get<NewsletterService>(NewsletterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNewsletterSubscription function', () => {
    it('should return a correct responseDto', async () => {
      // Mock call to Dto validator
      const validatorSpy = jest
        .spyOn(newsletterService, 'isCreateNewsletterSubscriptionDtoValid')
        .mockResolvedValue();

      // Mock call to DB
      const mainSpy = jest
        .spyOn(newsletterService, 'createSubscription')
        .mockResolvedValue(defaultNewsletterSubscriptionResponseDto);

      const response = await newsletterController.createSubscription(
        defaultCreateNewsletterSubscriptionDto,
      );

      expect(validatorSpy).toHaveBeenCalledTimes(1);
      expect(mainSpy).toHaveBeenCalledTimes(1);
      expect(mainSpy).toHaveBeenCalledWith(
        defaultCreateNewsletterSubscriptionDto,
      );
      expect(response).toBe(defaultNewsletterSubscriptionResponseDto);
    });
  });
});
