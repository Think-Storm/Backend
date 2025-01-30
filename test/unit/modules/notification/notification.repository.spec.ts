import { Test, TestingModule } from '@nestjs/testing';
import { NotificationRepository } from '../../../../src/modules/notification/notification.repository';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../../../src/common/enums/errorMessages';

describe('NotificationRepository', () => {
  let repository: NotificationRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<NotificationRepository>(NotificationRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const mockNotification = {
        id: 1,
        userId: 1,
        type: NotificationType.Welcome,
        description: 'Welcome!',
        isRead: false,
        link: null,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      const result = await repository.create(
        mockNotification.userId,
        mockNotification.type,
        mockNotification.description,
      );

      expect(result).toEqual(mockNotification);
      expect(prismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId: mockNotification.userId,
          type: mockNotification.type,
          description: mockNotification.description,
          isRead: false,
          link: undefined,
        },
      });
    });
  });

  describe('findAllByUserId', () => {
    it('should return all notifications for a user', async () => {
      const mockNotifications = [
        {
          id: 1,
          userId: 1,
          type: NotificationType.Welcome,
          description: 'Welcome!',
          isRead: false,
          link: null,
          createdAt: new Date(),
          lastUpdatedAt: new Date(),
        },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(
        mockNotifications,
      );

      const result = await repository.findAllByUserId(1);

      expect(result).toEqual(mockNotifications);
      expect(prismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('deleteById', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should delete a notification by id', async () => {
      const mockNotification = {
        id: 1,
        userId: 1,
        type: NotificationType.Welcome,
        description: 'Welcome!',
        isRead: false,
        link: null,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      mockPrismaService.notification.delete.mockResolvedValue(mockNotification);

      const result = await repository.deleteById(1);

      expect(result).toEqual(mockNotification);
      expect(prismaService.notification.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw error when notification does not exist', async () => {
      const prismaError = new Error('Record to delete does not exist');
      mockPrismaService.notification.delete.mockRejectedValue(prismaError);

      try {
        await repository.deleteById(999);
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceException);
        expect(error.message).toContain(
          errorMessages.ERROR_DELETING_NOTIFICATION_IN_DB,
        );
      }
      expect(prismaService.notification.delete).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe('deleteAllByUserId', () => {
    it('should delete all notifications for a user', async () => {
      const mockDeleteResult = { count: 5 };
      mockPrismaService.notification.deleteMany.mockResolvedValue(
        mockDeleteResult,
      );

      const result = await repository.deleteAllByUserId(1);

      expect(result).toEqual({ count: 5 });
      expect(prismaService.notification.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });
  });
});
