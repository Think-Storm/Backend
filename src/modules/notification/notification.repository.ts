import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Notification, NotificationType } from '@prisma/client';

@Injectable()
export class NotificationRepository {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: number,
    type: NotificationType,
    description: string,
    link?: string,
  ): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        description,
        isRead: false,
        link,
      },
    });
  }

  async findAllByUserId(userId: number): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteById(id: number): Promise<Notification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.delete({
      where: { id },
    });
  }

  async deleteAllByUserId(userId: number): Promise<{ count: number }> {
    const result = await this.prisma.notification.deleteMany({
      where: {
        userId,
      },
    });
    return { count: result.count };
  }

  async findById(id: number): Promise<Notification | null> {
    return this.prisma.notification.findUnique({
      where: { id },
    });
  }
}
