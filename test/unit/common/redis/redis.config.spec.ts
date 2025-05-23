import {
  throttlerConfig,
  cachingConfig,
} from '../../../../src/common/redis/redis.config';

describe('redis.config', () => {
  const mockConfigService = {
    get: jest.fn((key: string) => {
      const map = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        REDIS_THROTTLER_DB: 1,
        REDIS_USER: 'user',
        REDIS_PASSWORD: 'pass',
        REDIS_CACHING_DB: 2,
        REDIS_CACHING_TTL: 3600,
      };
      return map[key];
    }),
  } as any;

  it('should return throttler config', () => {
    const config = throttlerConfig(mockConfigService);
    expect(config).toEqual({
      host: 'localhost',
      port: 6379,
      db: 1,
      username: 'user',
      password: 'pass',
    });
  });

  it('should return caching config and cover retryStrategy', () => {
    const config = cachingConfig(mockConfigService);
    expect(config.host).toBe('localhost');
    expect(config.port).toBe(6379);
    expect(config.username).toBe('user');
    expect(config.password).toBe('pass');
    expect(config.db).toBe(2);
    expect(config.ttl).toBe(3600);

    // Cover retryStrategy
    expect(config.retryStrategy(1)).toBe(50);
    expect(config.retryStrategy(100)).toBe(2000);
  });
});
