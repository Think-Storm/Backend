import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectModule } from './modules/project/project.module';
import { CommonDataModule } from './modules/common-data/common-data.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { RATE_LIMITING_LIMIT, RATE_LIMITING_TTL } from './common/consts';
import { RedisThrottlerStorageService } from './common/throttler/redisThrottlerStorage.service';
import { RedisService } from './common/throttler/redisThrottler.service';
import { ThrottlerAbusingGuard } from './common/throttler/throttlerAbusingGuard';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';
import { cachingConfig } from './common/redis/redis.config';
import { WaitingListUserModule } from './modules/waiting_list_user/waitingListUser.module';

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
    ProjectModule,
    CommonDataModule,
    AuthModule,
    WaitingListUserModule,
    RouterModule.register([
      {
        path: 'users',
        module: UserModule,
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
        path: 'waiting-list-users',
        module: WaitingListUserModule,
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
