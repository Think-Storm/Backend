import { Test, TestingModule } from '@nestjs/testing';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { JwtService } from '@nestjs/jwt';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '../../../../src/prisma/prisma.module';
import { NewsletterService } from '../../../../src/modules/newsletter/newsletter.service';
import { NewsletterRepository } from '../../../../src/modules/newsletter/newsletter.repository';
import { NewsletterController } from '../../../../src/modules/newsletter/newsletter.controller';
import { NewsletterMapper } from '../../../../src/modules/newsletter/dtos/newsletter.mapper';
import {
  defaultCreateNewsletterSubscriptionDto,
  defaultNewsletterSubscription,
} from '../../../utils/newsletter.utils';

describe('WaitingListUserService', () => {
  let newsletterService: NewsletterService;
  let newsletterRepository: NewsletterRepository;
  const prismaClient = new PrismaClient();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prismaClient)],
      controllers: [NewsletterController],
      providers: [
        NewsletterService,
        NewsletterRepository,
        NewsletterMapper,
        JwtService,
        ConfigService,
      ],
    })
      .overrideInterceptor(ClassSerializerInterceptor)
      .useClass(ClassSerializerInterceptor)
      .compile();

    newsletterService = module.get<NewsletterService>(NewsletterService);
    newsletterRepository =
      module.get<NewsletterRepository>(NewsletterRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isCreateNewsletterSubscriptionDtoValid function', () => {
    it('should throw an exception if newsletterSubscription already exists with email', async () => {
      // Mock call to DB to return a NewsletterSubscription
      const spy = jest
        .spyOn(newsletterRepository, 'getSubscriptionByEmail')
        .mockResolvedValue(defaultNewsletterSubscription);

      expect(
        newsletterService.isCreateNewsletterSubscriptionDtoValid(
          defaultCreateNewsletterSubscriptionDto,
        ),
      ).rejects.toThrow(ServiceException);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not throw an exception if no waitingListUser exists with email', async () => {
      // Mock call to DB not to return a WaitingListUser
      const spy = jest
        .spyOn(newsletterRepository, 'getSubscriptionByEmail')
        .mockResolvedValue(null);

      expect(() =>
        newsletterService.isCreateNewsletterSubscriptionDtoValid(
          defaultCreateNewsletterSubscriptionDto,
        ),
      ).not.toThrow();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('createWaitingListUser function', () => {
    it('should create waitingListUser and map the result into WaitingListUserResponseDto', async () => {
      // Mock call to DB
      const dbSpy = jest
        .spyOn(newsletterRepository, 'createSubscription')
        .mockResolvedValue(defaultNewsletterSubscription);

      const expectedResponseDto = {
        id: defaultNewsletterSubscription.id,
        email: defaultNewsletterSubscription.email,
        createdAt: defaultNewsletterSubscription.createdAt,
        lastUpdatedAt: defaultNewsletterSubscription.lastUpdatedAt,
      };

      const waitingListUserResponseDto =
        await newsletterService.createSubscription(
          defaultCreateNewsletterSubscriptionDto,
        );

      // Checking the mapper
      expect(waitingListUserResponseDto).toEqual(expectedResponseDto);
      expect(dbSpy).toHaveBeenCalledTimes(1);
    });
  });
});
