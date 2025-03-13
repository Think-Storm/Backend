/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { RedisThrottlerStorageService } from '../../../../src/common/throttler/redisThrottlerStorage.service';
import { RedisService } from '../../../../src/common/throttler/redisThrottler.service';
import { ConfigService } from '@nestjs/config';
import {
  BLOCK_REQUEST_TIME,
  RATE_LIMITING_TTL,
} from '../../../../src/common/consts';

const mockThrottlerOptions = {
  name: 'API Rate Limiter',
  limit: expect.any(Function),
  ttl: RATE_LIMITING_TTL,
  blockDuration: BLOCK_REQUEST_TIME * 1000,
  ignoreUserAgents: expect.any(Array),
  skipIf: expect.any(Function),
  generateKey: expect.any(Function),
};

describe('RedisThrottlerStorageService', () => {
  let service: RedisThrottlerStorageService;
  let redisService: RedisService;

  const mockRedisClient = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  };

  beforeEach(async () => {
    jest.useFakeTimers();

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
    redisService = module.get<RedisService>(RedisService);

    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('Storage Operations', () => {
    describe('get', () => {
      it('should retrieve and parse stored throttle data', async () => {
        const mockData = JSON.stringify(mockThrottlerOptions);
        mockRedisClient.get.mockResolvedValue(mockData);

        const result = await service.get('test-key');

        expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
        expect(result).toMatchObject({
          name: 'API Rate Limiter',
          ttl: RATE_LIMITING_TTL,
          blockDuration: 3600000,
        });
      });

      it('should return null for non-existent key', async () => {
        mockRedisClient.get.mockResolvedValue(null);
        const result = await service.get('non-existent');
        expect(result).toBeNull();
      });
    });

    describe('set', () => {
      it('should store new throttle data', async () => {
        jest.spyOn(service, 'get').mockResolvedValue(null);
        jest.spyOn(service, 'decrementBlockDuration').mockResolvedValue();

        await service.set('test-key');

        expect(mockRedisClient.set).toHaveBeenCalledWith(
          'test-key',
          expect.any(String),
        );
      });

      it('should update existing throttle data', async () => {
        const existingOptions = {
          ...mockThrottlerOptions,
          blockDuration: 60000,
        };
        jest.spyOn(service, 'get').mockResolvedValue(existingOptions);
        jest.spyOn(service, 'decrementBlockDuration').mockResolvedValue();

        await service.set('test-key');

        expect(mockRedisClient.set).toHaveBeenCalled();
      });
    });

    describe('decrementBlockDuration', () => {
      it('should handle block duration countdown', async () => {
        const mockOptions = { ...mockThrottlerOptions, blockDuration: 5000 };
        jest.spyOn(service, 'get').mockResolvedValue(mockOptions);
        const decrSpy = jest.spyOn(service, 'decrby').mockResolvedValue();

        await service.decrementBlockDuration('test-key');
        jest.advanceTimersByTime(1000);
        await Promise.resolve();

        expect(decrSpy).toHaveBeenCalledWith('test-key', 1000);
      });

      it('should clear existing interval for same key', async () => {
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
        await service.decrementBlockDuration('test-key');
        await service.decrementBlockDuration('test-key');
        expect(clearIntervalSpy).toHaveBeenCalled();
      });
    });

    describe('delete', () => {
      it('should remove throttle data and clear interval', async () => {
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
        await service.decrementBlockDuration('test-key');
        await service.delete('test-key');

        expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
        expect(clearIntervalSpy).toHaveBeenCalled();
      });
    });
  });
});
