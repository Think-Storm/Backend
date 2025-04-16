import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetNotificationReadDto {
  @ApiProperty({
    description: 'Whether the notification should be marked as read',
    example: true,
  })
  @IsBoolean()
  isRead: boolean;
}
