import { Injectable } from '@nestjs/common';
import { ThrottlerStorageService, ThrottlerOptions } from '@nestjs/throttler';
import { RedisService } from './redisThrottler.service';
import { throttlerOptions } from './throttlerOptions';
import { RATE_LIMITING_TTL } from '../consts';

@Injectable()
export class RedisThrottlerStorageService extends ThrottlerStorageService {
  private activeIntervals: Map<string, NodeJS.Timeout> = new Map(); // Track active intervals

  constructor(private readonly redisService: RedisService) {
    super();
  }

  async get(key: string): Promise<ThrottlerOptions | null> {
    const data = await this.redisService.getClient().get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string): Promise<void> {
    let sendResult: ThrottlerOptions = throttlerOptions;
    const data = await this.get(key);

    if (data) {
      //if it is blocked id
      sendResult = data;
    } else {
      //if it isn't in the blocekd id list
      const ttl = RATE_LIMITING_TTL / 1000; // Convert to seconds for Redis TTL
      sendResult.ttl = ttl;
    }
    await this.redisService.getClient().set(key, JSON.stringify(sendResult));
    //decrease blocked duration time
    await this.decrementBlockDuration(key);
  }

  async decrementBlockDuration(key: string): Promise<void> {
    // Check if an interval is already active for this key
    if (this.activeIntervals.has(key)) {
      clearInterval(this.activeIntervals.get(key)); // Clear the existing interval
    }

    // Create a new interval to decrement the block duration
    const interval = setInterval(async () => {
      const blockedIpData = await this.get(key);
      const remainingTime = blockedIpData?.blockDuration;

      if (!remainingTime || Number(remainingTime) <= 0) {
        clearInterval(interval); // Stop the countdown when the block expires
        await this.delete(key); // Optionally delete the key
      } else {
        // Decrement the block duration by 1 second
        await this.decrby(key, 1000); // Decrease by 1 second
      }
    }, 1000); // Decrease every second (1000ms)

    // Store the interval ID for this key
    this.activeIntervals.set(key, interval);
  }

  async decrby(key: string, decreaseSeconds: number) {
    const blockedIpData = await this.get(key);
    const remainingTime = Number(blockedIpData.blockDuration) - decreaseSeconds;
    blockedIpData.blockDuration = remainingTime;
    await this.redisService.getClient().set(key, JSON.stringify(blockedIpData));
  }

  async delete(key: string): Promise<void> {
    // Check if an interval is already active for this key
    if (this.activeIntervals.has(key)) {
      clearInterval(this.activeIntervals.get(key)); // Clear the existing interval
    }
    await this.redisService.getClient().del(key);
  }

  async keys(): Promise<string[]> {
    return await this.redisService.getClient().keys('*');
  }
}
