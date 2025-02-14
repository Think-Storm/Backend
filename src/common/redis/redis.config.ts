import { ConfigService } from '@nestjs/config';

export function throttlerConfig(configService: ConfigService) {
  return {
    host: configService.get<string>('REDIS_HOST'), // Use ConfigService to get environment variables
    port: configService.get<number>('REDIS_PORT'),
    db: configService.get<number>('REDIS_THROTTLER_DB'),
    //password: configService.get<string>('REDIS_PASSWORD'),
  };
}

export function cachingConfig(configService: ConfigService) {
  return {
    host: configService.get<string>('REDIS_HOST'), // Use ConfigService to get environment variables
    port: configService.get<number>('REDIS_PORT'),
    //password: configService.get<string>('REDIS_PASSWORD'),
    db: configService.get<number>('REDIS_CACHING_DB'),
    ttl: configService.get<number>('REDIS_CACHING_TTL'),
    retryStrategy: (times) => Math.min(times * 50, 2000),
  };
}
