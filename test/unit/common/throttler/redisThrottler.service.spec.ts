import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../../../../src/common/throttler/redisThrottler.service';
import { ConfigService } from '@nestjs/config';

jest.mock('ioredis', () => {
  const Redis = jest.fn().mockImplementation(() => ({
    call: jest.fn().mockImplementation(() => Promise.resolve('PONG')),
    flushdb: jest.fn().mockImplementation(() => Promise.resolve('OK')),
    disconnect: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
    set: jest.fn().mockImplementation(() => Promise.resolve('OK')),
    get: jest.fn(),
    del: jest.fn(),
  }));

  return { Redis, default: Redis };
});

describe('RedisService', () => {
  let service: RedisService;
  let configService: ConfigService;
  let mockRedisInstance: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockRedisInstance = {
      call: jest.fn().mockImplementation(() => Promise.resolve('PONG')),
      flushdb: jest.fn().mockImplementation(() => Promise.resolve('OK')),
      disconnect: jest.fn(),
      quit: jest.fn(),
      on: jest.fn(),
      set: jest.fn().mockImplementation(() => Promise.resolve('OK')),
      get: jest.fn(),
      del: jest.fn(),
    };

    const { Redis } = jest.requireMock('ioredis');
    Redis.mockImplementation(() => mockRedisInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation(
              (key) =>
                ({
                  REDIS_HOST: 'localhost',
                  REDIS_PORT: 6379,
                  REDIS_PASSWORD: 'password',
                  REDIS_THROTTLER_DB: 0,
                })[key],
            ),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('Redis Operations', () => {
    describe('Redis Client Operations', () => {
      it('should get Redis client', () => {
        const client = service.getClient();
        expect(client).toBeDefined();
        expect(client).toBe(mockRedisInstance);
      });

      it('should ping Redis server', async () => {
        const result = await service.ping();
        expect(result).toBe('PONG');
        expect(mockRedisInstance.call).toHaveBeenCalledWith('PING');
      });

      it('should handle ping failure', async () => {
        mockRedisInstance.call.mockRejectedValue(
          new Error('Connection failed'),
        );
        await expect(service.ping()).rejects.toThrow('Redis connection issue');
      });
    });

    describe('Database Management', () => {
      it('should flush database', async () => {
        await service.flushDb();
        expect(mockRedisInstance.flushdb).toHaveBeenCalled();
      });

      it('should handle disconnect', () => {
        service.disconnect();
        expect(mockRedisInstance.disconnect).toHaveBeenCalled();
      });

      it('should not call disconnect if Redis client is undefined', () => {
        Object.defineProperty(service, 'redis', { value: undefined });
        service.disconnect();
        expect(mockRedisInstance.disconnect).not.toHaveBeenCalled();
      });
    });

    describe('Module Lifecycle', () => {
      it('should initialize Redis connection', async () => {
        await service.OnModuleInit(configService);
        expect(mockRedisInstance.on).toHaveBeenCalledWith(
          'connect',
          expect.any(Function),
        );
        expect(mockRedisInstance.on).toHaveBeenCalledWith(
          'error',
          expect.any(Function),
        );
        expect(mockRedisInstance.on).toHaveBeenCalledWith(
          'reconnecting',
          expect.any(Function),
        );
        expect(mockRedisInstance.on).toHaveBeenCalledWith(
          'close',
          expect.any(Function),
        );
      });

      it('should cleanup on module destroy', async () => {
        await service.OnModuleDestroy();
        expect(mockRedisInstance.quit).toHaveBeenCalled();
      });

      it('should handle connection events', async () => {
        const consoleSpy = jest.spyOn(console, 'log');
        await service.OnModuleInit(configService);

        const connectHandler = mockRedisInstance.on.mock.calls.find(
          (call) => call[0] === 'connect',
        )[1];
        connectHandler();

        expect(consoleSpy).toHaveBeenCalledWith('Redis client connected');
      });

      it('should handle error events', async () => {
        const consoleSpy = jest.spyOn(console, 'error');
        await service.OnModuleInit(configService);

        const errorHandler = mockRedisInstance.on.mock.calls.find(
          (call) => call[0] === 'error',
        )[1];
        const testError = new Error('Test error');
        errorHandler(testError);
        expect(consoleSpy).toHaveBeenCalledWith(
          'Redis client error:',
          testError,
        );
      });
    });
  });
});
