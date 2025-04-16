import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Notification, NotificationType } from '@prisma/client';
import { ServiceException } from '../../common/exception-filter/serviceException';
import { errorMessages } from '../../common/enums/errorMessages';

@Injectable()
export class NotificationRepository {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: number,
    type: NotificationType,
    description: string,
    link?: string,
  ): Promise<Notification> {
    try {
      return await this.prisma.notification.create({
        data: {
          userId,
          type,
          description,
          isRead: false,
          link,
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_CREATING_NOTIFICATION_IN_DB,
        error,
      );
    }
  }

  async findAllByUserId(userId: number): Promise<Notification[]> {
    try {
      return await this.prisma.notification.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_FINDING_NOTIFICATIONS,
        error,
      );
    }
  }

  async deleteById(id: number): Promise<Notification> {
    try {
      return await this.prisma.notification.delete({
        where: { id },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_DELETING_NOTIFICATION_IN_DB,
        error,
      );
    }
  }

  async deleteAllByUserId(userId: number): Promise<{ count: number }> {
    try {
      const result = await this.prisma.notification.deleteMany({
        where: {
          userId,
        },
      });
      return { count: result.count };
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_DELETING_NOTIFICATIONS_IN_DB,
        error,
      );
    }
  }

  async findById(id: number): Promise<Notification | null> {
    try {
      return await this.prisma.notification.findUnique({
        where: { id },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_FINDING_NOTIFICATION,
        error,
      );
    }
  }

  async updateReadStatus(id: number, isRead: boolean): Promise<Notification> {
    try {
      return await this.prisma.notification.update({
        where: { id },
        data: { isRead },
      });
    } catch (error) {
      throw ServiceException.ErrorException(
        errorMessages.ERROR_UPDATING_NOTIFICATION,
        error,
      );
    }
  }
}
