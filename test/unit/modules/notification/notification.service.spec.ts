import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from '../../../../src/modules/notification/notification.service';
import { NotificationRepository } from '../../../../src/modules/notification/notification.repository';
import { NotificationType } from '@prisma/client';
import { notificationMessages } from '../../../../src/common/enums/notificationMessages';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';

describe('NotificationService', () => {
  let service: NotificationService;
  let repository: NotificationRepository;

  const mockNotificationRepository = {
    create: jest.fn(),
    findAllByUserId: jest.fn(),
    deleteById: jest.fn(),
    deleteAllByUserId: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: NotificationRepository,
          useValue: mockNotificationRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    repository = module.get<NotificationRepository>(NotificationRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWelcomeNotification', () => {
    it('should create a welcome notification', async () => {
      const userId = 1;
      const name = 'Test User';
      const mockNotification = {
        id: 1,
        userId,
        type: NotificationType.Welcome,
        description: notificationMessages.WELCOME(name),
        isRead: false,
        link: null,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      mockNotificationRepository.create.mockResolvedValue(mockNotification);

      const result = await service.createWelcomeNotification(userId, name);

      expect(result).toEqual(mockNotification);
      expect(repository.create).toHaveBeenCalledWith(
        userId,
        NotificationType.Welcome,
        notificationMessages.WELCOME(name),
      );
    });
  });

  describe('createJoinRequestNotification', () => {
    it('should create a join request notification', async () => {
      const userId = 1;
      const projectTitle = 'Test Project';
      const projectId = 1;
      const mockNotification = {
        id: 1,
        userId,
        type: NotificationType.JoinRequest,
        description: notificationMessages.JOIN_REQUEST(projectTitle),
        link: `/projects/${projectId}`,
        isRead: false,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      mockNotificationRepository.create.mockResolvedValue(mockNotification);

      const result = await service.createJoinRequestNotification(
        userId,
        projectTitle,
        projectId,
      );

      expect(result).toEqual(mockNotification);
      expect(repository.create).toHaveBeenCalledWith(
        userId,
        NotificationType.JoinRequest,
        notificationMessages.JOIN_REQUEST(projectTitle),
        `/projects/${projectId}`,
      );
    });
  });

  describe('createAcceptJoinRequestNotification', () => {
    it('should create an accept join request notification', async () => {
      const userId = 1;
      const projectTitle = 'Test Project';
      const projectId = 1;
      const mockNotification = {
        id: 1,
        userId,
        type: NotificationType.AcceptJoinRequest,
        description: notificationMessages.ACCEPT_JOIN_REQUEST(projectTitle),
        link: `/projects/${projectId}`,
        isRead: false,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      mockNotificationRepository.create.mockResolvedValue(mockNotification);

      const result = await service.createAcceptJoinRequestNotification(
        userId,
        projectTitle,
        projectId,
      );

      expect(result).toEqual(mockNotification);
      expect(repository.create).toHaveBeenCalledWith(
        userId,
        NotificationType.AcceptJoinRequest,
        notificationMessages.ACCEPT_JOIN_REQUEST(projectTitle),
        `/projects/${projectId}`,
      );
    });
  });

  describe('createInviteToProjectNotification', () => {
    it('should create an invite to project notification', async () => {
      const userId = 1;
      const projectTitle = 'Test Project';
      const projectId = 1;
      const mockNotification = {
        id: 1,
        userId,
        type: NotificationType.InviteToProject,
        description: notificationMessages.INVITE_TO_PROJECT(projectTitle),
        link: `/projects/${projectId}`,
        isRead: false,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      mockNotificationRepository.create.mockResolvedValue(mockNotification);

      const result = await service.createInviteToProjectNotification(
        userId,
        projectTitle,
        projectId,
      );

      expect(result).toEqual(mockNotification);
      expect(repository.create).toHaveBeenCalledWith(
        userId,
        NotificationType.InviteToProject,
        notificationMessages.INVITE_TO_PROJECT(projectTitle),
        `/projects/${projectId}`,
      );
    });
  });

  describe('getUserNotifications', () => {
    it('should return all notifications for a user', async () => {
      const userId = 1;
      const mockNotifications = [
        {
          id: 1,
          userId,
          type: NotificationType.Welcome,
          description: 'Welcome!',
          isRead: false,
          link: null,
          createdAt: new Date(),
          lastUpdatedAt: new Date(),
        },
      ];

      mockNotificationRepository.findAllByUserId.mockResolvedValue(
        mockNotifications,
      );

      const result = await service.getUserNotifications(userId);

      expect(result).toEqual(mockNotifications);
      expect(repository.findAllByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('deleteNotification', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should delete a notification', async () => {
      const notificationId = 1;
      const mockNotification = {
        id: notificationId,
        userId: 1,
        type: NotificationType.Welcome,
        description: 'Welcome!',
        isRead: false,
        link: null,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      mockNotificationRepository.findById.mockResolvedValue(mockNotification);
      mockNotificationRepository.deleteById.mockResolvedValue(mockNotification);

      const result = await service.deleteNotification(notificationId);

      expect(result).toEqual(mockNotification);
      expect(repository.findById).toHaveBeenCalledWith(notificationId);
      expect(repository.deleteById).toHaveBeenCalledWith(notificationId);
    });

    it('should throw NotFoundException when notification does not exist', async () => {
      const notificationId = 999;
      mockNotificationRepository.findById.mockResolvedValue(null);

      try {
        await service.deleteNotification(notificationId);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceException);
        expect(error.message).toContain(
          `Notification with id ${notificationId} was not found`,
        );
      }
      expect(repository.findById).toHaveBeenCalledWith(notificationId);
      expect(repository.deleteById).not.toHaveBeenCalled();
    });
  });

  describe('clearAllNotifications', () => {
    it('should clear all notifications for a user', async () => {
      const userId = 1;
      const mockResult = { count: 5 };

      mockNotificationRepository.deleteAllByUserId.mockResolvedValue(
        mockResult,
      );

      const result = await service.clearAllNotifications(userId);

      expect(result).toEqual(mockResult);
      expect(repository.deleteAllByUserId).toHaveBeenCalledWith(userId);
    });
  });
});
