import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../../../../src/common/throttler/redisThrottler.service';
import { ConfigService } from '@nestjs/config';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';

jest.mock('ioredis', () => {
  const Redis = jest.fn().mockImplementation(() => ({
    call: jest.fn().mockResolvedValue('PONG'),
    flushdb: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
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
      call: jest.fn().mockResolvedValue('PONG'),
      flushdb: jest.fn().mockResolvedValue('OK'),
      disconnect: jest.fn(),
      quit: jest.fn().mockResolvedValue('OK'),
      on: jest.fn(),
    };

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
    Object.defineProperty(service, 'redis', { value: mockRedisInstance });
  });

  describe('Constructor', () => {
    it('should initialize Redis with proper config', () => {
      const newService = new RedisService(configService);
      expect(newService).toBeDefined();
    });

    it('should handle initialization errors', () => {
      jest.spyOn(configService, 'get').mockImplementation(() => {
        throw new Error();
      });
      expect(() => new RedisService(configService)).toThrow();
    });
  });

  describe('Redis Client Operations', () => {
    it('should get Redis client', () => {
      const client = service.getClient();
      expect(client).toBeDefined();
      expect(client).toBe(mockRedisInstance);
    });

    it('should ping Redis server successfully', async () => {
      const result = await service.ping();
      expect(result).toBe('PONG');
      expect(mockRedisInstance.call).toHaveBeenCalledWith('PING');
    });

    it('should handle ping failure', async () => {
      mockRedisInstance.call.mockRejectedValue(new Error('Connection failed'));
      await expect(service.ping()).rejects.toThrow(ServiceException);
    });
  });

  describe('Database Management', () => {
    it('should flush database', async () => {
      await service.flushDb();
      expect(mockRedisInstance.flushdb).toHaveBeenCalled();
    });

    it('should handle flush database errors', async () => {
      mockRedisInstance.flushdb.mockRejectedValue(new Error('Flush failed'));
      await expect(service.flushDb()).rejects.toThrow();
    });

    it('should disconnect Redis client', () => {
      service.disconnect();
      expect(mockRedisInstance.disconnect).toHaveBeenCalled();
    });

    it('should handle undefined Redis client during disconnect', () => {
      Object.defineProperty(service, 'redis', { value: undefined });
      expect(() => service.disconnect()).not.toThrow();
    });
  });

  describe('Module Lifecycle', () => {
    describe('OnModuleInit', () => {
      it('should setup all event listeners', async () => {
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

      it('should handle event setup errors', async () => {
        mockRedisInstance.on.mockImplementation(() => {
          throw new Error('Event setup failed');
        });

        await expect(service.OnModuleInit(configService)).rejects.toThrow(
          ServiceException,
        );
      });

      describe('Event Handlers', () => {
        let consoleSpy: jest.SpyInstance;

        beforeEach(() => {
          consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        });

        afterEach(() => {
          consoleSpy.mockRestore();
        });

        it('should handle connect event', async () => {
          await service.OnModuleInit(configService);

          const connectHandler = mockRedisInstance.on.mock.calls.find(
            (call) => call[0] === 'connect',
          )[1];
          connectHandler();

          expect(consoleSpy).toHaveBeenCalledWith('Redis client connected');
        });

        it('should handle error event', async () => {
          await service.OnModuleInit(configService);

          const errorHandler = mockRedisInstance.on.mock.calls.find(
            (call) => call[0] === 'error',
          )[1];
          errorHandler(new Error('Redis error'));

          expect(consoleSpy).toHaveBeenCalledWith('Redis client error');
        });

        it('should handle reconnecting event', async () => {
          await service.OnModuleInit(configService);

          const reconnectHandler = mockRedisInstance.on.mock.calls.find(
            (call) => call[0] === 'reconnecting',
          )[1];
          reconnectHandler();

          expect(consoleSpy).toHaveBeenCalledWith(
            'Redis client reconnecting...',
          );
        });

        it('should handle close event', async () => {
          await service.OnModuleInit(configService);

          const closeHandler = mockRedisInstance.on.mock.calls.find(
            (call) => call[0] === 'close',
          )[1];
          closeHandler();

          expect(consoleSpy).toHaveBeenCalledWith('Redis client closed');
        });
      });
    });

    describe('OnModuleDestroy', () => {
      it('should quit Redis client', async () => {
        await service.OnModuleDestroy();
        expect(mockRedisInstance.quit).toHaveBeenCalled();
      });

      it('should handle quit errors', async () => {
        mockRedisInstance.quit.mockRejectedValue(new Error('Quit failed'));
        await expect(service.OnModuleDestroy()).rejects.toThrow();
      });
    });
  });
});
