import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateNewsletterSubscription } from '@think-storm/contracts';

export class CreateNewsletterSubscriptionDto
  implements CreateNewsletterSubscription
{
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address to subscribe to the newsletter',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
