import { CreateNotification, NotificationType } from '@think-storm/contracts';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';

export class CreateNotificationDto implements CreateNotification {
  @ApiProperty({
    description: 'The ID of the user who the notification is for',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: 'The type of notification',
    example: NotificationType.Welcome,
  })
  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'The description of the notification',
    example: 'Welcome to the platform',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'The link of the notification',
    example: 'https://www.thinkstorm.app/projects/1',
  })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiProperty({
    description: 'Whether the notification has been read',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
