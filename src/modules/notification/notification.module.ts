import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { NotificationMapper } from './dtos/notification.mapper';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository, NotificationMapper],
  exports: [NotificationService],
})
export class NotificationModule {}
