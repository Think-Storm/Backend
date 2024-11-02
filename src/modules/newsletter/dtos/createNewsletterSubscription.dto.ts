import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNewsletterSubscriptionDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address to subscribe to the newsletter',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
