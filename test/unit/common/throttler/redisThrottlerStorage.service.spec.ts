import { Test, TestingModule } from '@nestjs/testing';
import {
  RedisThrottlerStorageService,
  THROTTLER_BLOCK_PREFIX,
} from '../../../../src/common/throttler/redisThrottlerStorage.service';
import { RedisService } from '../../../../src/common/throttler/redisThrottler.service';
import { ConfigService } from '@nestjs/config';
import {
  BLOCK_REQUEST_TIME,
  RATE_LIMITING_TTL,
} from '../../../../src/common/consts';

describe('RedisThrottlerStorageService', () => {
  let service: RedisThrottlerStorageService;

  const KEY = '203.0.113.7';
  const PREFIXED = `${THROTTLER_BLOCK_PREFIX}${KEY}`;

  const mockRedisClient = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    pttl: jest.fn(),
    scan: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisThrottlerStorageService,
        {
          provide: RedisService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockRedisClient),
            flushDb: jest.fn(),
          },
        },
        ConfigService,
      ],
    }).compile();

    service = module.get<RedisThrottlerStorageService>(
      RedisThrottlerStorageService,
    );

    jest.clearAllMocks();
  });

  describe('get', () => {
    it('reports the block duration left on the key, not the stored value', async () => {
      mockRedisClient.get.mockResolvedValue(
        JSON.stringify({
          name: 'API Rate Limiter',
          ttl: RATE_LIMITING_TTL,
          blockDuration: BLOCK_REQUEST_TIME * 1000,
        }),
      );
      mockRedisClient.pttl.mockResolvedValue(120000);

      const result = await service.get(KEY);

      expect(mockRedisClient.get).toHaveBeenCalledWith(PREFIXED);
      expect(mockRedisClient.pttl).toHaveBeenCalledWith(PREFIXED);
      expect(result).toMatchObject({
        name: 'API Rate Limiter',
        ttl: RATE_LIMITING_TTL,
        blockDuration: 120000,
      });
    });

    it('clamps a missing or absent ttl to zero', async () => {
      mockRedisClient.get.mockResolvedValue(
        JSON.stringify({ blockDuration: BLOCK_REQUEST_TIME * 1000 }),
      );
      mockRedisClient.pttl.mockResolvedValue(-1);

      const result = await service.get(KEY);

      expect(result.blockDuration).toBe(0);
    });

    it('returns null for a key that is not blocked', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.pttl.mockResolvedValue(-2);

      expect(await service.get(KEY)).toBeNull();
    });
  });

  describe('set', () => {
    it('writes the block with a native expiry and does not overwrite an existing one', async () => {
      await service.set(KEY);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        PREFIXED,
        expect.any(String),
        'EX',
        BLOCK_REQUEST_TIME,
        'NX',
      );
    });

    it('stores only serialisable bookkeeping fields', async () => {
      await service.set(KEY);

      const payload = JSON.parse(mockRedisClient.set.mock.calls[0][1]);
      expect(payload).toEqual({
        name: 'API Rate Limiter',
        ttl: RATE_LIMITING_TTL,
        blockDuration: BLOCK_REQUEST_TIME * 1000,
      });
    });
  });

  describe('delete', () => {
    it('removes the namespaced key', async () => {
      await service.delete(KEY);
      expect(mockRedisClient.del).toHaveBeenCalledWith(PREFIXED);
    });
  });

  describe('keys', () => {
    it('scans the prefix across cursor pages and strips it from results', async () => {
      mockRedisClient.scan
        .mockResolvedValueOnce(['17', [`${THROTTLER_BLOCK_PREFIX}a`]])
        .mockResolvedValueOnce(['0', [`${THROTTLER_BLOCK_PREFIX}b`]]);

      const result = await service.keys();

      expect(result).toEqual(['a', 'b']);
      expect(mockRedisClient.scan).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.scan).toHaveBeenLastCalledWith(
        '17',
        'MATCH',
        `${THROTTLER_BLOCK_PREFIX}*`,
        'COUNT',
        100,
      );
    });

    it('returns an empty list when nothing is blocked', async () => {
      mockRedisClient.scan.mockResolvedValueOnce(['0', []]);
      expect(await service.keys()).toEqual([]);
    });
  });
});
