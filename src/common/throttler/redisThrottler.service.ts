import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { throttlerConfig } from '../redis/redis.config';
import { ConfigService } from '@nestjs/config';

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
      console.error('Error pinging Redis:', error);
      throw new Error('Redis connection issue');
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

    try {
      await this.ping();
    } catch (error) {
      throw error;
    }

    //Event listeners for connection status
    this.redis.on('connect', () => {
      console.log('Redis client connected');
    });

    this.redis.on('error', (error) => {
      console.error('Redis client error:', error);
    });

    this.redis.on('reconnecting', () => {
      console.log('Redis client reconnecting...');
    });

    this.redis.on('close', () => {
      console.log('Redis client closed');
    });
  }

  async OnModuleDestroy() {
    await this.redis.quit();
  }
}
