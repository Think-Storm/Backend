import { ConfigService } from '@nestjs/config';

export function throttlerConfig(configService: ConfigService) {
  // return {
  //   host: configService.get<string>('REDIS_HOST'), // Use ConfigService to get environment variables
  //   port: configService.get<number>('REDIS_PORT'),
  //   db: configService.get<number>('REDIS_THROTTLER_DB'),
  //   username: configService.get<string>('REDIS_USER'),
  //   password: configService.get<string>('REDIS_PASSWORD'),
  // };
  return {
    url: configService.get<string>('REDIS_THROTTLER_URL'),
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    family: 6,
  };
}

export function cachingConfig(configService: ConfigService) {
  // return {
  //   host: configService.get<string>('REDIS_HOST'), // Use ConfigService to get environment variables
  //   port: configService.get<number>('REDIS_PORT'),
  //   username: configService.get<string>('REDIS_USER'),
  //   password: configService.get<string>('REDIS_PASSWORD'),
  //   db: configService.get<number>('REDIS_CACHING_DB'),
  //   ttl: configService.get<number>('REDIS_CACHING_TTL'),
  //   retryStrategy: (times) => Math.min(times * 50, 2000),
  // };
  return {
    url: configService.get<string>('REDIS_CACHING_URL'),
    ttl: configService.get<number>('REDIS_CACHING_TTL'),
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    family: 6,
  };
}
