import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NewsletterSubscriptionResponse } from '@think-storm/contracts';

export class NewsletterSubscriptionResponseDto
  implements NewsletterSubscriptionResponse
{
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the newsletter subscription',
  })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The subscribed email address',
  })
  @Expose()
  email: string;

  @ApiProperty({
    example: '2024-03-14T12:00:00Z',
    description: 'The date and time when the subscription was created',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    example: '2024-03-14T12:00:00Z',
    description: 'The date and time when the subscription was last updated',
  })
  @Expose()
  lastUpdatedAt: Date;
}
