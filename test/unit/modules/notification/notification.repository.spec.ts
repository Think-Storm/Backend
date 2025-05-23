import { Test, TestingModule } from '@nestjs/testing';
import { NotificationRepository } from '../../../../src/modules/notification/notification.repository';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { mockNotification } from '../../../utils/notification.utils';

describe('NotificationRepository', () => {
  let repository: NotificationRepository;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationRepository,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    repository = module.get<NotificationRepository>(NotificationRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      prismaService.notification.create.mockResolvedValue(mockNotification);
      const result = await repository.create(
        mockNotification.userId,
        mockNotification.type,
        mockNotification.description,
        mockNotification.link,
      );
      expect(result).toEqual(mockNotification);
      expect(prismaService.notification.create).toHaveBeenCalled();
    });

    it('should throw ServiceException on error', async () => {
      prismaService.notification.create.mockRejectedValue(
        new Error('DB error'),
      );
      await expect(
        repository.create(
          mockNotification.userId,
          mockNotification.type,
          mockNotification.description,
          mockNotification.link,
        ),
      ).rejects.toThrow(ServiceException);
    });
  });

  describe('findAllByUserId', () => {
    it('should return all notifications for a user', async () => {
      prismaService.notification.findMany.mockResolvedValue([mockNotification]);
      const result = await repository.findAllByUserId(1);
      expect(result).toEqual([mockNotification]);
      expect(prismaService.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should throw ServiceException on error', async () => {
      prismaService.notification.findMany.mockRejectedValue(
        new Error('DB error'),
      );
      await expect(repository.findAllByUserId(1)).rejects.toThrow(
        ServiceException,
      );
    });
  });

  describe('deleteById', () => {
    it('should delete a notification by id', async () => {
      prismaService.notification.delete.mockResolvedValue(mockNotification);
      const result = await repository.deleteById(1);
      expect(result).toEqual(mockNotification);
      expect(prismaService.notification.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw ServiceException on error', async () => {
      prismaService.notification.delete.mockRejectedValue(
        new Error('DB error'),
      );
      await expect(repository.deleteById(1)).rejects.toThrow(ServiceException);
    });
  });

  describe('deleteAllByUserId', () => {
    it('should delete all notifications for a user', async () => {
      prismaService.notification.deleteMany.mockResolvedValue({ count: 2 });
      const result = await repository.deleteAllByUserId(1);
      expect(result).toEqual({ count: 2 });
      expect(prismaService.notification.deleteMany).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });

    it('should throw ServiceException on error', async () => {
      prismaService.notification.deleteMany.mockRejectedValue(
        new Error('DB error'),
      );
      await expect(repository.deleteAllByUserId(1)).rejects.toThrow(
        ServiceException,
      );
    });
  });

  describe('findById', () => {
    it('should find a notification by id', async () => {
      prismaService.notification.findUnique.mockResolvedValue(mockNotification);
      const result = await repository.findById(1);
      expect(result).toEqual(mockNotification);
      expect(prismaService.notification.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw ServiceException on error', async () => {
      prismaService.notification.findUnique.mockRejectedValue(
        new Error('DB error'),
      );
      await expect(repository.findById(1)).rejects.toThrow(ServiceException);
    });
  });

  describe('updateReadStatus', () => {
    it('should update notification read status', async () => {
      prismaService.notification.update.mockResolvedValue({
        ...mockNotification,
        isRead: true,
      });
      const result = await repository.updateReadStatus(1, true);
      expect(result).toEqual({ ...mockNotification, isRead: true });
      expect(prismaService.notification.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isRead: true },
      });
    });

    it('should throw ServiceException on error', async () => {
      prismaService.notification.update.mockRejectedValue(
        new Error('DB error'),
      );
      await expect(repository.updateReadStatus(1, true)).rejects.toThrow(
        ServiceException,
      );
    });
  });
});
