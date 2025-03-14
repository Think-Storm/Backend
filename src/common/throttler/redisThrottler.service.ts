import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { throttlerConfig } from '../redis/redis.config';
import { ConfigService } from '@nestjs/config';
import { ServiceException } from '../exception-filter/serviceException';
import { errorMessages } from '../enums/errorMessages';

@Injectable()
export class RedisService {
  private redis: Redis;

  constructor(configService: ConfigService) {
    this.redis = new Redis(throttlerConfig(configService));
  }

  getClient(): Redis {
    return this.redis;
  }

  async ping(): Promise<any> {
    try {
      const response = await this.redis.call('PING');
      return response;
    } catch (error) {
      throw new ServiceException(
        errorMessages.REDIS_CONNECTION_ISSUE('Error pinging Redis'),
        500,
      );
    }
  }

  async flushDb() {
    await this.redis.flushdb();
  }

  disconnect() {
    if (this.redis) {
      this.redis.disconnect();
    }
  }

  async OnModuleInit(configService: ConfigService) {
    if (!this.redis) {
      this.redis = new Redis(throttlerConfig(configService));
    }

    await this.ping();

    //Event listeners for connection status
    try {
      this.redis.on('connect', () => {
        console.log('Redis client connected');
      });
    } catch (error) {
      throw new ServiceException(
        errorMessages.REDIS_CONNECTION_ISSUE('Redis client connected'),
        500,
        error,
      );
    }

    try {
      this.redis.on('error', () => {
        console.log('Redis client error');
      });
    } catch (error) {
      throw new ServiceException(
        errorMessages.REDIS_CONNECTION_ISSUE('Redis client error'),
        500,
        error,
      );
    }

    try {
      this.redis.on('reconnecting', () => {
        console.log('Redis client reconnecting...');
      });
    } catch (error) {
      throw new ServiceException(
        errorMessages.REDIS_CONNECTION_ISSUE('Redis client reconnecting...'),
        500,
        error,
      );
    }

    try {
      this.redis.on('close', () => {
        console.log('Redis client closed');
      });
    } catch (error) {
      throw new ServiceException(
        errorMessages.REDIS_CONNECTION_ISSUE('Redis client closed'),
        500,
        error,
      );
    }
  }

  async OnModuleDestroy() {
    await this.redis.quit();
  }
}
