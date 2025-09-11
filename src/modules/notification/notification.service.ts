import { Injectable } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { notificationMessages } from '../../common/enums/notificationMessages';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { errorMessages } from '../../common/enums/errorMessages';
import { NotificationType, Notification } from '@think-storm/contracts';
import { NotificationMapper } from './dtos/notification.mapper';
@Injectable()
export class NotificationService {
  constructor(
    private notificationRepository: NotificationRepository,
    private notificationMapper: NotificationMapper,
  ) {}

  async createWelcomeNotification(
    userId: number,
    name: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.create(
      userId,
      NotificationType.Welcome,
      notificationMessages.WELCOME(name),
    );
    return this.notificationMapper.notificationToNotificationResponseDto(
      notification,
    );
  }

  async createJoinRequestNotification(
    userId: number,
    projectTitle: string,
    projectId: number,
  ) {
    const description = notificationMessages.JOIN_REQUEST(projectTitle);
    const link = `/projects/${projectId}`;
    const notification = await this.notificationRepository.create(
      userId,
      NotificationType.JoinRequest,
      description,
      link,
    );
    return this.notificationMapper.notificationToNotificationResponseDto(
      notification,
    );
  }

  async createAcceptJoinRequestNotification(
    userId: number,
    projectTitle: string,
    projectId: number,
  ) {
    const description = notificationMessages.ACCEPT_JOIN_REQUEST(projectTitle);
    const link = `/projects/${projectId}`;
    const notification = await this.notificationRepository.create(
      userId,
      NotificationType.AcceptJoinRequest,
      description,
      link,
    );
    return this.notificationMapper.notificationToNotificationResponseDto(
      notification,
    );
  }

  async createInviteToProjectNotification(
    userId: number,
    projectTitle: string,
    projectId: number,
  ) {
    const description = notificationMessages.INVITE_TO_PROJECT(projectTitle);
    const link = `/projects/${projectId}`;
    const notification = await this.notificationRepository.create(
      userId,
      NotificationType.InviteToProject,
      description,
      link,
    );
    return this.notificationMapper.notificationToNotificationResponseDto(
      notification,
    );
  }

  async getUserNotifications(userId: number) {
    const notifications =
      await this.notificationRepository.findAllByUserId(userId);
    return this.notificationMapper.notificationsToNotificationResponseDtos(
      notifications,
    );
  }

  async deleteNotification(id: number) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('Notification', id.toString()),
      );
    }
    return await this.notificationRepository.deleteById(id);
  }

  async clearAllNotifications(userId: number) {
    return await this.notificationRepository.deleteAllByUserId(userId);
  }

  async setNotificationRead(id: number, isRead: boolean) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('Notification', id.toString()),
      );
    }
    const updatedNotification =
      await this.notificationRepository.updateReadStatus(id, isRead);
    return this.notificationMapper.notificationToNotificationResponseDto(
      updatedNotification,
    );
  }
}
