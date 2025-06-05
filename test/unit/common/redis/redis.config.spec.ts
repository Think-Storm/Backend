import {
  throttlerConfig,
  cachingConfig,
} from '../../../../src/common/redis/redis.config';
import { ConfigService } from '@nestjs/config';

describe('redis.config', () => {
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'REDIS_THROTTLER_URL':
            return 'redis://:pass@localhost:6379/1';
          case 'REDIS_CACHING_URL':
            return 'redis://:pass@localhost:6379/2';
          case 'REDIS_CACHING_TTL':
            return 3600;
          default:
            return null;
        }
      }),
    } as unknown as jest.Mocked<ConfigService>;
  });

  describe('throttlerConfig', () => {
    it('should return throttler URL string', () => {
      const config = throttlerConfig(mockConfigService);

      expect(config).toBe('redis://:pass@localhost:6379/1');
      expect(mockConfigService.get).toHaveBeenCalledWith('REDIS_THROTTLER_URL');
    });
  });

  describe('cachingConfig', () => {
    it('should return caching config object', () => {
      const config = cachingConfig(mockConfigService);

      expect(config).toEqual({
        url: 'redis://:pass@localhost:6379/2',
        ttl: 3600,
        retryStrategy: expect.any(Function),
      });

      expect(mockConfigService.get).toHaveBeenCalledWith('REDIS_CACHING_URL');
      expect(mockConfigService.get).toHaveBeenCalledWith('REDIS_CACHING_TTL');
    });

    it('should have retry strategy that increases with attempts up to max', () => {
      const config = cachingConfig(mockConfigService);
      const retryStrategy = config.retryStrategy;

      expect(retryStrategy(1)).toBe(50);
      expect(retryStrategy(10)).toBe(500);
      expect(retryStrategy(100)).toBe(2000);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
