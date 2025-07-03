import { Injectable } from '@nestjs/common';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { CreateNewsletterSubscriptionDto } from './dtos/createNewsletterSubscription.dto';
import { NewsletterSubscriptionResponseDto } from './dtos/newsletterSubscriptionResponse.dto';
import { NewsletterRepository } from './newsletter.repository';
import { errorMessages } from '../../common/enums/errorMessages';
import { NewsletterSubscription } from '@prisma/client';
import { NewsletterMapper } from './dtos/newsletter.mapper';

@Injectable()
export class NewsletterService {
  constructor(
    private newsletterRepository: NewsletterRepository,
    private newsletterMapper: NewsletterMapper,
  ) {}

  /**
   * Checks if a newsletter subscription exists for a given email
   * @param email - The email to check for newsletter subscription
   * @returns A Promise that resolves to the newsletter subscription if it exists, or null if it does not
   */
  async doesASubscriptionExist(email: string): Promise<NewsletterSubscription> {
    return await this.newsletterRepository.getSubscriptionByEmail(email);
  }

  /**
   * Validates the newsletter subscription creation data transfer object
   * @param dto - The newsletter subscription creation data transfer object to validate
   * @throws ServiceException.BadRequestException if a newsletter subscription with the same email already exists
   */
  async isCreateNewsletterSubscriptionDtoValid(
    dto: CreateNewsletterSubscriptionDto,
  ) {
    if (await this.doesASubscriptionExist(dto.email)) {
      throw ServiceException.BadRequestException(
        errorMessages.WAITING_LIST_USER_WITH_EMAIL_ALREADY_EXISTS,
      );
    }
  }

  async createSubscription(
    createNewsletterDto: CreateNewsletterSubscriptionDto,
  ): Promise<NewsletterSubscriptionResponseDto> {
    const createdNewsletter =
      await this.newsletterRepository.createSubscription(createNewsletterDto);

    return this.newsletterMapper.newsletterToNewsletterSubscriptionResponseDTO(
      createdNewsletter,
    );
  }
}
