import { Injectable } from '@nestjs/common';
import { ThrottlerStorageService, ThrottlerOptions } from '@nestjs/throttler';
import { RedisService } from './redisThrottler.service';
import { throttlerOptions } from './throttlerOptions';
import { BLOCK_REQUEST_TIME, RATE_LIMITING_TTL } from '../consts';

// Namespaced so the block list never collides with anything else sharing the
// database, and so keys() can scan a prefix instead of the whole keyspace.
export const THROTTLER_BLOCK_PREFIX = 'throttler:block:';

@Injectable()
export class RedisThrottlerStorageService extends ThrottlerStorageService {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  private blockKey(key: string): string {
    return `${THROTTLER_BLOCK_PREFIX}${key}`;
  }

  async get(key: string): Promise<ThrottlerOptions | null> {
    const client = this.redisService.getClient();
    const blockKey = this.blockKey(key);
    const [data, pttl] = await Promise.all([
      client.get(blockKey),
      client.pttl(blockKey),
    ]);

    if (!data) {
      return null;
    }

    // Redis owns the countdown via the key's TTL, so report what is actually
    // left rather than a decremented copy. pttl is -1 (no expiry) or -2 (gone).
    const remaining = pttl > 0 ? pttl : 0;
    return { ...JSON.parse(data), blockDuration: remaining } as ThrottlerOptions;
  }

  async set(key: string): Promise<void> {
    // Only the serialisable bookkeeping fields — throttlerOptions carries
    // functions that JSON.stringify would silently drop.
    const record = JSON.stringify({
      name: throttlerOptions.name,
      ttl: RATE_LIMITING_TTL,
      blockDuration: BLOCK_REQUEST_TIME * 1000,
    });

    // NX: an existing block keeps its original expiry, so a caller that keeps
    // hammering while blocked cannot reset its own countdown.
    await this.redisService
      .getClient()
      .set(this.blockKey(key), record, 'EX', BLOCK_REQUEST_TIME, 'NX');
  }

  async delete(key: string): Promise<void> {
    await this.redisService.getClient().del(this.blockKey(key));
  }

  async keys(): Promise<string[]> {
    // SCAN rather than KEYS: KEYS blocks the server for the whole keyspace and
    // is rate-limited or rejected outright by hosted Redis providers.
    const client = this.redisService.getClient();
    const found: string[] = [];
    let cursor = '0';

    do {
      const [next, batch] = await client.scan(
        cursor,
        'MATCH',
        `${THROTTLER_BLOCK_PREFIX}*`,
        'COUNT',
        100,
      );
      cursor = next;
      found.push(...batch.map((k) => k.slice(THROTTLER_BLOCK_PREFIX.length)));
    } while (cursor !== '0');

    return found;
  }
}
