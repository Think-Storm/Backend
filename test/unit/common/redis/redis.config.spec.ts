import {
  throttlerConfig,
  cachingConfig,
} from '../../../../src/common/redis/redis.config';
import { ConfigService } from '@nestjs/config';

describe('redis.config', () => {
  const mockConfigService = {
    get: jest.fn((key: string) => {
      const map = {
        REDIS_THROTTLER_URL: 'redis://:pass@localhost:6379/1',
        REDIS_CACHING_URL: 'redis://:pass@localhost:6379/2',
      };
      return map[key];
    }),
  } as unknown as jest.Mocked<ConfigService>;

  describe('throttlerConfig', () => {
    it('should return throttler URL from config', () => {
      const config = throttlerConfig(mockConfigService);
      expect(config).toBe('redis://:pass@localhost:6379/1');
      expect(mockConfigService.get).toHaveBeenCalledWith('REDIS_THROTTLER_URL');
    });
  });

  describe('cachingConfig', () => {
    it('should return caching URL from config', () => {
      const config = cachingConfig(mockConfigService);
      expect(config).toBe('redis://:pass@localhost:6379/2');
      expect(mockConfigService.get).toHaveBeenCalledWith('REDIS_CACHING_URL');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
