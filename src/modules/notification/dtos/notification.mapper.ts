import { instanceToPlain, plainToInstance } from 'class-transformer';
import { NotificationResponseDto } from './notificationResponse.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Notification } from '@think-storm/contracts';

export class NotificationMapper {
  /**
   * Maps a Notification entity to a NotificationResponseDto
   */
  @ApiProperty({ type: NotificationResponseDto })
  notificationToNotificationResponseDto(
    notification: Notification,
  ): NotificationResponseDto {
    return plainToInstance(
      NotificationResponseDto,
      instanceToPlain(notification),
      {
        excludeExtraneousValues: true,
      },
    );
  }

  /**
   * Maps a Notification entities to a NotificationResponseDtos
   */
  @ApiProperty({ type: NotificationResponseDto })
  notificationsToNotificationResponseDtos(
    notifications: Notification[],
  ): NotificationResponseDto[] {
    return notifications.map((notification) =>
      plainToInstance(NotificationResponseDto, instanceToPlain(notification), {
        excludeExtraneousValues: true,
      }),
    );
  }
}
