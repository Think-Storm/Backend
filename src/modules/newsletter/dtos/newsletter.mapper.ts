import { NewsletterSubscriptionResponseDto } from './newsletterSubscriptionResponse.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NewsletterSubscription } from '@think-storm/contracts';

export class NewsletterMapper {
  /**
   * Maps a Newsletter entity to a NewsletterSubscriptionResponseDto
   */
  @ApiProperty({ type: NewsletterSubscriptionResponseDto })
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
