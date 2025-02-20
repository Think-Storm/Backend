import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { cachingConfig } from '../redis/redis.config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
  private redis: Redis;

  constructor(configService: ConfigService) {
    this.redis = new Redis(cachingConfig(configService));
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

  async set(key: string, value: any, ttl: number): Promise<void> {
    try {
      let ttlNum = ttl;
      // Validate TTL
      if (!Number.isInteger(ttl) || ttl <= 0) {
        ttlNum = Number(ttl);
      }
      // Set data with TTL (expires in seconds)
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlNum);
    } catch (error) {
      console.error('Error setting data in Redis:', error);
    }
  }

  async get(key: string): Promise<any> {
    return await this.redis.get(key);
  }

  async delete(key: string) {
    await this.redis.del(key);
    console.log(`Cache invalidated for key: ${key}`);
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
      this.redis = new Redis(cachingConfig(configService));
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
