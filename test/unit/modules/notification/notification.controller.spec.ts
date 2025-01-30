import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from '../../../../src/modules/notification/notification.controller';
import { NotificationService } from '../../../../src/modules/notification/notification.service';
import { mockUser } from '../../../utils/notification.utils';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockNotificationService = {
    getUserNotifications: jest.fn(),
    deleteNotification: jest.fn(),
    clearAllNotifications: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllNotifications', () => {
    it('should return all notifications for the user', async () => {
      const mockNotifications = [{ id: 1, description: 'Test notification' }];
      mockNotificationService.getUserNotifications.mockResolvedValue(
        mockNotifications,
      );

      const result = await controller.getAllNotifications(mockUser);

      expect(result).toEqual(mockNotifications);
      expect(service.getUserNotifications).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification by id', async () => {
      const mockNotification = { id: 1, description: 'Test notification' };
      mockNotificationService.deleteNotification.mockResolvedValue(
        mockNotification,
      );

      const result = await controller.deleteNotification(1);

      expect(result).toEqual(mockNotification);
      expect(service.deleteNotification).toHaveBeenCalledWith(1);
    });
  });

  describe('deleteAllNotifications', () => {
    it('should delete all notifications for the user', async () => {
      const mockResult = { count: 5 };
      mockNotificationService.clearAllNotifications.mockResolvedValue(
        mockResult,
      );

      const result = await controller.deleteAllNotifications(mockUser);

      expect(result).toEqual(mockResult);
      expect(service.clearAllNotifications).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
