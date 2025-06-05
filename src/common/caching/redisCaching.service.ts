import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { cachingConfig } from '../redis/redis.config';
import { ConfigService } from '@nestjs/config';
import { ServiceException } from '../exception-filter/serviceException';
import { errorMessages } from '../enums/errorMessages';

@Injectable()
export class RedisService {
  private redis: Redis;

  constructor(configService: ConfigService) {
    this.redis = new Redis(cachingConfig(configService).url);
  }

  getClient(): Redis {
    if (!this.redis) {
      throw new ServiceException(
        errorMessages.REDIS_CONNECTION_ISSUE('Redis client not initialized'),
        500,
      );
    }
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

  async set(key: string, value: any, ttl: number): Promise<void> {
    try {
      const ttlNum = ttl;
      // Validate TTL
      if (!Number.isInteger(ttl) || ttl <= 0) {
        throw ServiceException.BadRequestException(
          errorMessages.CACHING_TTL_ERROR,
        );
      }
      // Set data with TTL (expires in seconds)
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlNum);
    } catch (error) {
      throw new ServiceException(
        errorMessages.REDIS_CONNECTION_ISSUE('Error setting data in Redis'),
        500,
      );
    }
  }

  async get(key: string): Promise<any> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      throw new ServiceException(
        errorMessages.REDIS_CONNECTION_ISSUE('Error getting data from Redis'),
        500,
      );
    }
  }

  async delete(key: string) {
    try {
      await this.redis.del(key);
    } catch (error) {
      throw new ServiceException(
        errorMessages.REDIS_CONNECTION_ISSUE('Error deleting data from Redis'),
        500,
      );
    }
  }

  async flushDb() {
    try {
      await this.redis.flushdb();
    } catch (error) {
      throw new ServiceException(
        errorMessages.REDIS_CONNECTION_ISSUE('Error flushing Redis DB'),
        500,
      );
    }
  }

  disconnect() {
    if (this.redis) {
      this.redis.disconnect();
    }
  }

  async OnModuleInit(configService: ConfigService) {
    if (!this.redis) {
      this.redis = new Redis(cachingConfig(configService).url);
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
