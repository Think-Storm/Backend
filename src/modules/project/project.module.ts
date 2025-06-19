import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectRepository } from './project.repository';
import { ProjectMapper } from './dtos/project.mapper';
import { UserModule } from '../user/user.module';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { cachingConfig } from '../../common/redis/redis.config';
import * as redisStore from 'cache-manager-ioredis';
import { RedisService } from '../../common/caching/redisCaching.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationRepository } from '../notification/notification.repository';

/**
 * The ProjectModule is responsible for managing the project-related components
 * and services including controllers, services, repositories, and mappers.
 */
@Module({
  imports: [
    UserModule,
    CacheModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        ...cachingConfig(config),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ProjectController],
  providers: [
    ProjectService,
    ProjectRepository,
    PrismaService,
    ProjectMapper,
    ConfigService,
    RedisService,
    NotificationService,
    NotificationRepository,
  ],
})
export class ProjectModule {}
