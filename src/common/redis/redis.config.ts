import { ConfigService } from '@nestjs/config';

export function throttlerConfig(configService: ConfigService) {
  return {
    url: configService.get<string>('REDIS_THROTTLER_URL'),
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  };
}

export function cachingConfig(configService: ConfigService) {
  return {
    url: configService.get<string>('REDIS_CACHING_URL'),
    ttl: configService.get<number>('REDIS_CACHING_TTL'),
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  };
}
