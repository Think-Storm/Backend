import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NewsletterSubscription } from '@prisma/client';
import { CreateNewsletterSubscriptionDto } from './dtos/createNewsletterSubscription.dto';
import { ServiceException } from '../../common/exception-filter/serviceException';

@Injectable()
export class NewsletterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSubscriptionByEmail(email: string) {
    return this.prisma.newsletterSubscription.findFirst({
      where: {
        email: {
          equals: email.toLowerCase(),
        },
      },
    });
  }

  async createSubscription(
    createNewsletterSubscriptionDto: CreateNewsletterSubscriptionDto,
  ): Promise<NewsletterSubscription> {
    try {
      return this.prisma.newsletterSubscription.create({
        data: {
          email: createNewsletterSubscriptionDto.email.toLowerCase(),
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(error.message, error);
    }
  }
}
