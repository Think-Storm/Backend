import { Injectable } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { Notification, NotificationType } from '@prisma/client';
import { notificationMessages } from '../../common/enums/notificationMessages';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { errorMessages } from '../../common/enums/errorMessages';

@Injectable()
export class NotificationService {
  constructor(private notificationRepository: NotificationRepository) {}

  async createWelcomeNotification(
    userId: number,
    name: string,
  ): Promise<Notification> {
    return this.notificationRepository.create(
      userId,
      NotificationType.Welcome,
      notificationMessages.WELCOME(name),
    );
  }

  async createJoinRequestNotification(
    userId: number,
    projectTitle: string,
    projectId: number,
  ) {
    const description = notificationMessages.JOIN_REQUEST(projectTitle);
    const link = `/projects/${projectId}`;
    return this.notificationRepository.create(
      userId,
      NotificationType.JoinRequest,
      description,
      link,
    );
  }

  async createAcceptJoinRequestNotification(
    userId: number,
    projectTitle: string,
    projectId: number,
  ) {
    const description = notificationMessages.ACCEPT_JOIN_REQUEST(projectTitle);
    const link = `/projects/${projectId}`;
    return this.notificationRepository.create(
      userId,
      NotificationType.AcceptJoinRequest,
      description,
      link,
    );
  }

  async createInviteToProjectNotification(
    userId: number,
    projectTitle: string,
    projectId: number,
  ) {
    const description = notificationMessages.INVITE_TO_PROJECT(projectTitle);
    const link = `/projects/${projectId}`;
    return this.notificationRepository.create(
      userId,
      NotificationType.InviteToProject,
      description,
      link,
    );
  }

  async getUserNotifications(userId: number) {
    return this.notificationRepository.findAllByUserId(userId);
  }

  async deleteNotification(id: number) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND('Notification', id.toString()),
      );
    }
    return this.notificationRepository.deleteById(id);
  }

  async clearAllNotifications(userId: number) {
    return this.notificationRepository.deleteAllByUserId(userId);
  }
}
