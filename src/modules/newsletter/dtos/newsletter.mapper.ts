import { NewsletterSubscription } from '@prisma/client';
import { NewsletterSubscriptionResponseDto } from './newsletterSubscriptionResponse.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';

export class NewsletterMapper {
  /**
   * Maps a Newsletter entity to a NewsletterSubscriptionResponseDto
   */
  newsletterToNewsletterSubscriptionResponseDTO(
    newsletter: NewsletterSubscription,
  ): NewsletterSubscriptionResponseDto {
    return plainToInstance(
      NewsletterSubscriptionResponseDto,
      instanceToPlain(newsletter),
      {
        excludeExtraneousValues: true,
      },
    );
  }
}
