import { ApiProperty } from '@nestjs/swagger';
import { SetNotificationRead } from '@think-storm/contracts';
import { IsBoolean } from 'class-validator';

export class SetNotificationReadDto implements SetNotificationRead {
  @ApiProperty({
    description: 'Whether the notification should be marked as read',
    example: true,
  })
  @IsBoolean()
  isRead: boolean;
}
