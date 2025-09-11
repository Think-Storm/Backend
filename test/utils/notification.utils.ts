import {
  NotificationResponse,
  NotificationType,
  User,
} from '@think-storm/contracts';
import { notificationMessages } from '../../src/common/enums/notificationMessages';
import { CreateNotificationDto } from '../../src/modules/notification/dtos/createNotification.dto';

export const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  password: 'hashedPassword',
  passwordSalt: 'salt',
  passwordChangedAt: new Date(),
  createdAt: new Date(),
  lastUpdatedAt: new Date(),
};

export const defaultWelcomeNotification: CreateNotificationDto = {
  userId: 1,
  type: NotificationType.Welcome,
  description: notificationMessages.WELCOME('Test User'),
  link: null,
  isRead: false,
};

export const defaultJoinRequestNotification: CreateNotificationDto = {
  userId: 1,
  type: NotificationType.JoinRequest,
  description: notificationMessages.JOIN_REQUEST('Test Project'),
  link: '/projects/1',
  isRead: false,
};

export const defaultAcceptJoinRequestNotification: CreateNotificationDto = {
  userId: 1,
  type: NotificationType.AcceptJoinRequest,
  description: notificationMessages.ACCEPT_JOIN_REQUEST('Test Project'),
  link: '/projects/1',
  isRead: false,
};

export const defaultInviteToProjectNotification: CreateNotificationDto = {
  userId: 1,
  type: NotificationType.InviteToProject,
  description: notificationMessages.INVITE_TO_PROJECT('Test Project'),
  link: '/projects/1',
  isRead: false,
};

export const mockNotification: NotificationResponse = {
  id: 1,
  userId: 1,
  type: NotificationType.Welcome,
  description: 'Welcome!',
  isRead: true,
  link: null,
  createdAt: new Date(),
  lastUpdatedAt: new Date(),
};

export const createTestNotification = async (
  prisma: any,
  notification: CreateNotificationDto,
) => {
  return await prisma.notification.create({ data: notification });
};

export const createTestNotifications = async (
  prisma: any,
  notifications: CreateNotificationDto[],
) => {
  return await Promise.all(
    notifications.map((notification) =>
      createTestNotification(prisma, notification),
    ),
  );
};
