import { NewsletterRepository } from '../../../../src/modules/newsletter/newsletter.repository';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultCreateNewsletterSubscriptionDto } from '../../../utils/newsletter.utils';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaModule } from '../../../../src/prisma/prisma.module';

describe('WaitingListUserRepository', () => {
  let prismaService: PrismaService;
  let newsletterRepository: NewsletterRepository;
  const prismaClient = new PrismaClient();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule.forTest(prismaClient)],
      providers: [NewsletterRepository, ConfigService],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    newsletterRepository =
      module.get<NewsletterRepository>(NewsletterRepository);

    await prismaService.$connect();
    await prismaService.project.deleteMany();
    await prismaService.user.deleteMany();
    await prismaService.newsletterSubscription.deleteMany();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await prismaService.project.deleteMany();
    await prismaService.user.deleteMany();
    await prismaService.newsletterSubscription.deleteMany();
  });

  describe('createNewsletterSubscription function', () => {
    it('should create a new newsletterSubscription in DB', async () => {
      const newsletterSubscription =
        await newsletterRepository.createSubscription(
          defaultCreateNewsletterSubscriptionDto,
        );

      expect(newsletterSubscription).toHaveProperty('id');
      expect(newsletterSubscription.createdAt).toBeDefined();
      expect(newsletterSubscription.lastUpdatedAt).toBeDefined();

      expect(newsletterSubscription.email).toBe(
        defaultCreateNewsletterSubscriptionDto.email,
      );
    });
  });

  describe('getNewsletterSubscriptionByEmail function', () => {
    it('should retrieve a newsletterSubscription in DB with email', async () => {
      // Create a newsletterSubscription in DB to fetch
      await newsletterRepository.createSubscription(
        defaultCreateNewsletterSubscriptionDto,
      );

      const newsletterSubscription =
        await newsletterRepository.getSubscriptionByEmail(
          defaultCreateNewsletterSubscriptionDto.email,
        );

      expect(newsletterSubscription).toBeDefined();
      expect(newsletterSubscription.email).toBe(
        defaultCreateNewsletterSubscriptionDto.email,
      );
    });

    it('should not retrieve a newsletterSubscription in DB if there is no newsletterSubscription with email', async () => {
      // Create a newsletterSubscription in DB with a different email
      await newsletterRepository.createSubscription(
        defaultCreateNewsletterSubscriptionDto,
      );

      const fakeEmail = 'fakeEmail@email.com';
      const newsletterSubscription =
        await newsletterRepository.getSubscriptionByEmail(fakeEmail);

      expect(newsletterSubscription).toBeNull();
    });
  });
});
