// External imports
import { Module } from '@nestjs/common';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';

// Module imports
import { UserModule } from './modules/user/user.module';
import { ProfileModule } from './modules/profile/profile.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectModule } from './modules/project/project.module';
import { CommonDataModule } from './modules/common-data/common-data.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';

// Service imports
import { RedisThrottlerStorageService } from './common/throttler/redisThrottlerStorage.service';
import { RedisService } from './common/throttler/redisThrottler.service';
import { ThrottlerAbusingGuard } from './common/throttler/throttlerAbusingGuard';

// Config & Constants
import { RATE_LIMITING_LIMIT, RATE_LIMITING_TTL } from './common/consts';
import { cachingConfig } from './common/redis/redis.config';
import { NotificationModule } from './modules/notification/notification.module';

// Controllers
import { AppController } from './app.controller';
import { AwsS3Module } from './modules/aws-s3/aws-s3.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      global: true,
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: RATE_LIMITING_TTL,
        limit: RATE_LIMITING_LIMIT,
      },
    ]),
    CacheModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        ...cachingConfig(config),
      }),
      inject: [ConfigService],
    }),
    UserModule,
    ProfileModule,
    ProjectModule,
    CommonDataModule,
    AuthModule,
    NewsletterModule,
    NotificationModule,
    AwsS3Module,
    RouterModule.register([
      {
        path: 'aws-s3',
        module: AwsS3Module,
      },
      {
        path: 'users',
        module: UserModule,
      },
      {
        path: 'profiles',
        module: ProfileModule,
      },
      {
        path: 'projects',
        module: ProjectModule,
      },
      {
        path: 'common-data',
        module: CommonDataModule,
      },
      {
        path: 'newsletter',
        module: NewsletterModule,
      },
      {
        path: 'notifications',
        module: NotificationModule,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: ThrottlerAbusingGuard },
    RedisThrottlerStorageService,
    RedisService,
  ],
})
export class AppModule {}
