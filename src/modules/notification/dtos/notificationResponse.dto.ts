import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationResponse, NotificationType } from '@think-storm/contracts';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class NotificationResponseDto implements NotificationResponse {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the newsletter subscription',
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'The ID of the user who the notification is for',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  userId: number;

  @ApiProperty({
    description: 'The type of notification',
    example: NotificationType.Welcome,
  })
  @IsNotEmpty()
  @IsEnum(NotificationType)
  @Expose()
  type: NotificationType;

  @ApiProperty({
    description: 'The description of the notification',
    example: 'Welcome to the platform',
  })
  @IsNotEmpty()
  @IsString()
  @Expose()
  description: string;

  @ApiProperty({
    description: 'The link of the notification',
    example: 'https://www.thinkstorm.app/projects/1',
  })
  @IsOptional()
  @IsString()
  @Expose()
  link: string;

  @ApiProperty({
    description: 'Whether the notification has been read',
    example: false,
  })
  @IsBoolean()
  @Expose()
  isRead: boolean;

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
