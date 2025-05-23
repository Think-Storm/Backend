import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../../../../src/common/caching/redisCaching.service';
import { ConfigService } from '@nestjs/config';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';

jest.mock('ioredis', () => {
  const Redis = jest.fn().mockImplementation(() => ({
    call: jest.fn().mockResolvedValue('PONG'),
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
    del: jest.fn().mockResolvedValue(1),
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
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      del: jest.fn().mockResolvedValue(1),
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
                  REDIS_CACHING_DB: 1,
                  REDIS_CACHING_TTL: 3600,
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

  describe('Basic Redis Operations', () => {
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

  describe('Cache Operations', () => {
    describe('set', () => {
      it('should set value with valid TTL', async () => {
        const key = 'test-key';
        const value = { data: 'test' };
        const ttl = 3600;

        await service.set(key, value, ttl);

        expect(mockRedisInstance.set).toHaveBeenCalledWith(
          key,
          JSON.stringify(value),
          'EX',
          ttl,
        );
      });

      it('should reject invalid TTL values', async () => {
        const testCases = [-1, 0, 1.5];
        for (const ttl of testCases) {
          await expect(service.set('key', 'value', ttl)).rejects.toThrow(
            ServiceException,
          );
        }
      });

      it('should handle Redis errors during set', async () => {
        mockRedisInstance.set.mockRejectedValue(new Error('Redis error'));
        await expect(service.set('key', 'value', 60)).rejects.toThrow(
          ServiceException,
        );
      });
    });

    describe('get', () => {
      it('should retrieve stored value', async () => {
        const mockValue = { data: 'test' };
        mockRedisInstance.get.mockResolvedValue(JSON.stringify(mockValue));

        const result = await service.get('test-key');
        expect(result).toBe(JSON.stringify(mockValue));
        expect(mockRedisInstance.get).toHaveBeenCalledWith('test-key');
      });

      it('should return null for non-existent key', async () => {
        mockRedisInstance.get.mockResolvedValue(null);
        const result = await service.get('non-existent');
        expect(result).toBeNull();
      });
    });

    describe('delete', () => {
      it('should delete cached value', async () => {
        await service.delete('test-key');
        expect(mockRedisInstance.del).toHaveBeenCalledWith('test-key');
      });
    });

    describe('flushDb', () => {
      it('should flush database', async () => {
        await service.flushDb();
        expect(mockRedisInstance.flushdb).toHaveBeenCalled();
      });
    });
  });

  describe('Connection Management', () => {
    describe('disconnect', () => {
      it('should disconnect Redis client', () => {
        service.disconnect();
        expect(mockRedisInstance.disconnect).toHaveBeenCalled();
      });

      it('should handle undefined Redis client', () => {
        Object.defineProperty(service, 'redis', { value: undefined });
        expect(() => service.disconnect()).not.toThrow();
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

      it('should handle Redis connection events', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        await service.OnModuleInit(configService);

        // Test connect event
        const connectHandler = mockRedisInstance.on.mock.calls.find(
          (call) => call[0] === 'connect',
        )[1];
        connectHandler();
        expect(consoleSpy).toHaveBeenCalledWith('Redis client connected');

        // Test error event
        const errorHandler = mockRedisInstance.on.mock.calls.find(
          (call) => call[0] === 'error',
        )[1];
        errorHandler();
        expect(consoleSpy).toHaveBeenCalledWith('Redis client error');

        // Test reconnecting event
        const reconnectingHandler = mockRedisInstance.on.mock.calls.find(
          (call) => call[0] === 'reconnecting',
        )[1];
        reconnectingHandler();
        expect(consoleSpy).toHaveBeenCalledWith('Redis client reconnecting...');

        // Test close event
        const closeHandler = mockRedisInstance.on.mock.calls.find(
          (call) => call[0] === 'close',
        )[1];
        closeHandler();
        expect(consoleSpy).toHaveBeenCalledWith('Redis client closed');
      });
    });
  });

  describe('Cache Operations', () => {
    describe('get', () => {
      it('should handle Redis errors during get', async () => {
        mockRedisInstance.get.mockRejectedValue(new Error('Redis error'));
        await expect(service.get('key')).rejects.toThrow(ServiceException);
      });
    });

    describe('delete', () => {
      it('should handle Redis errors during delete', async () => {
        mockRedisInstance.del.mockRejectedValue(new Error('Redis error'));
        await expect(service.delete('key')).rejects.toThrow(ServiceException);
      });
    });

    describe('flushDb', () => {
      it('should handle Redis errors during flushDb', async () => {
        mockRedisInstance.flushdb.mockRejectedValue(new Error('Redis error'));
        await expect(service.flushDb()).rejects.toThrow(ServiceException);
      });
    });
  });

  describe('getClient', () => {
    it('should throw ServiceException if redis is undefined', () => {
      Object.defineProperty(service, 'redis', { value: undefined });
      expect(() => service.getClient()).toThrow(ServiceException);
    });
  });
});
