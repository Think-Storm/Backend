/* eslint-disable @typescript-eslint/no-var-requires */
import { ExecutionContext } from '@nestjs/common';
import { ServiceExceptionToHttpExceptionFilter } from '../../../../src/common/exception-filter/serviceExceptionFilter';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../../../src/common/enums/errorMessages';
import { createMock } from '@golevelup/ts-jest';
import { Request, Response } from 'express';
import { RedisThrottlerStorageService } from '../../../../src/common/throttler/redisThrottlerStorage.service';
import { RedisService } from '../../../../src/common/throttler/redisThrottler.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BLOCK_REQUEST_TIME,
  RATE_LIMITING_LIMIT,
  RATE_LIMITING_TTL,
} from '../../../../src/common/consts';
import { mockThrottlerOptions } from '../../../utils/throttler.utils';

describe('ServiceExceptionToHttpExceptionFilter', () => {
  let filter: ServiceExceptionToHttpExceptionFilter;
  let mockResponse: Response;
  let mockRequest: Request;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let redisService: RedisService;
  let mockRedisThrottlerService: jest.Mocked<RedisThrottlerStorageService>;

  beforeAll(async () => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();
    // Mock RedisThrottlerStorageService
    mockRedisThrottlerService = {
      get: jest.fn(),
      set: jest.fn(),
      headers: {
        'x-forwarded-for': '127.0.0.1',
      },
    } as any;
    // Removed assignment to non-existent 'headers' property
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    } as any;

    mockRequest = {
      url: '/test-url',
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService, ConfigService],
    }).compile();

    redisService = module.get<RedisService>(RedisService);

    filter = new ServiceExceptionToHttpExceptionFilter(
      mockRedisThrottlerService,
    );
  });

  afterAll(async () => {
    // Close Redis connection when tests are done
    await redisService.OnModuleDestroy();
  });

  const mockHost = (
    req = mockRequest,
    res = mockResponse,
  ): ExecutionContext => {
    return createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    });
  };

  describe('catch in development environment', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      process.env.NODE_ENV = 'development';
    });

    it('should handle operational errors in development mode', () => {
      const exception = new ServiceException('Test error', 400, {
        type: 'Bad Request',
      });

      filter.catch(exception, mockHost());

      expect(mockStatus).toHaveBeenCalledWith(400);
      const jsonCall = mockJson.mock.calls[0][0];
      expect(jsonCall.statusCode).toBe(400);
      expect(jsonCall.message).toBe('Test error');
      expect(jsonCall.path).toBe('/test-url');
      expect(jsonCall.error).toEqual({ type: 'Bad Request' });
      expect(jsonCall.status).toBe('Fail');
      expect(jsonCall.timestamp).toBeDefined();
      expect(jsonCall.stack).toBeDefined();
    });

    it('should handle non-operational errors in development mode', () => {
      const exception = new ServiceException('Internal error', 500, {
        type: 'Server Error',
      });
      exception.isOperational = false;

      filter.catch(exception, mockHost());

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'Error',
        message: errorMessages.NONE_OPERATIONAL_ERROR,
        error: { type: 'Server Error' },
      });
    });
  });

  describe('catch in production environment', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      process.env.NODE_ENV = 'production';
    });

    it('should handle operational errors in production mode', () => {
      const exception = new ServiceException('Test error', 400, {
        type: 'Bad Request',
      });

      filter.catch(exception, mockHost());

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'Fail',
        message: 'Test error',
      });
    });

    it('should handle non-operational errors in production mode', () => {
      const exception = new ServiceException('Internal error', 500, {
        type: 'Server Error',
      });
      exception.isOperational = false;

      filter.catch(exception, mockHost());

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'Error',
        message: errorMessages.NONE_OPERATIONAL_ERROR,
        error: { type: 'Server Error' },
      });
    });
  });

  describe('Rate limiting errors', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      process.env.NODE_ENV = 'development';
      mockResponse.setHeader = jest.fn();
      mockRequest = {
        url: '/test-url',
        headers: { 'x-forwarded-for': '127.0.0.1' },
        connection: { remoteAddress: '127.0.0.1' },
      } as any;

      mockRedisThrottlerService.get.mockReset();
      mockRedisThrottlerService.set.mockReset();
      jest.clearAllMocks();
    });

    it('should handle throttling errors (429) with retry-after header', async () => {
      // Create throttling exception with proper setup
      const exception = new ServiceException(
        errorMessages.THROTTLER_BLOCK,
        429,
        { type: 'Rate Limit Exceeded' },
      );
      exception.isOperational = true;

      // Mock throttler data properly
      const mockThrottlerData = {
        limit: RATE_LIMITING_LIMIT,
        ttl: RATE_LIMITING_TTL,
        blockDuration: BLOCK_REQUEST_TIME * 1000,
        name: 'API Rate Limiter',
        ignoreUserAgents: [],
        skipIf: jest.fn(),
        generateKey: jest.fn(),
      };

      // Setup mock responses
      mockRedisThrottlerService.get.mockResolvedValue(mockThrottlerData);
      //mockRedisThrottlerService.set.mockResolvedValue();

      await filter.catch(exception, mockHost());

      // Verify throttler service interactions
      expect(mockRedisThrottlerService.get).toHaveBeenCalled();

      // Verify response headers and status
      expect(mockStatus).toHaveBeenCalledWith(429);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'retry-after',
        String(Number(mockThrottlerData.blockDuration) / 1000),
      );

      // Verify response body
      const jsonCall = mockJson.mock.calls[0][0];
      expect(jsonCall).toEqual({
        statusCode: 429,
        status: 'Fail',
        message: errorMessages.THROTTLER_BLOCK,
        path: '/test-url',
        error: { type: 'Rate Limit Exceeded' },
        timestamp: expect.any(String),
        stack: expect.any(String),
      });
    });

    it('should handle missing throttler data', async () => {
      const exception = new ServiceException(
        errorMessages.THROTTLER_BLOCK,
        429,
      );

      mockRedisThrottlerService.get.mockResolvedValue(null);
      mockRedisThrottlerService.set.mockResolvedValue();

      await filter.catch(exception, mockHost());

      expect(mockStatus).toHaveBeenCalledWith(429);
      expect(mockRedisThrottlerService.get).toHaveBeenCalled();
    });
  });

  describe('Error response structure', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockJson = jest.fn().mockReturnThis();
      mockStatus = jest.fn().mockReturnThis();
      mockResponse = {
        status: mockStatus,
        json: mockJson,
        setHeader: jest.fn(),
      } as any;
      mockRequest = {
        url: '/test-url',
        headers: { 'x-forwarded-for': '127.0.0.1' },
        connection: { remoteAddress: '127.0.0.1' },
      } as any;
    });

    it('should include stack trace in development mode', async () => {
      process.env.NODE_ENV = 'development';
      const exception = new ServiceException('Test error', 400);
      exception.isOperational = true;

      await filter.catch(exception, mockHost());

      const jsonCall = mockJson.mock.calls[0][0];
      expect(jsonCall).toMatchObject({
        statusCode: 400,
        status: 'Fail',
        message: 'Test error',
        path: '/test-url',
        stack: expect.any(String),
        timestamp: expect.any(String),
      });
    });

    it('should exclude stack trace in production mode', async () => {
      process.env.NODE_ENV = 'production';
      const exception = new ServiceException('Test error', 400);
      exception.isOperational = true;

      await filter.catch(exception, mockHost());

      expect(mockJson).toHaveBeenCalledWith({
        status: 'Fail',
        message: 'Test error',
      });
    });

    it('should handle auth errors correctly', async () => {
      process.env.NODE_ENV = 'development';
      const exception = new ServiceException(
        errorMessages.ENTITY_NOT_FOUND('User', '1'),
        401,
      );
      exception.isOperational = true;

      await filter.catch(exception, mockHost());

      const jsonCall = mockJson.mock.calls[0][0];
      expect(jsonCall).toMatchObject({
        statusCode: 401,
        status: 'Fail',
        message: errorMessages.ENTITY_NOT_FOUND('User', '1'),
        path: '/test-url',
      });
      expect(jsonCall.stack).toBeDefined();
      expect(jsonCall.timestamp).toBeDefined();
    });
  });

  describe('ThrottlerException handling', () => {
    it('should handle ThrottlerException and set retry-after header with blockedIpData', async () => {
      process.env.NODE_ENV = 'development';
      const { ThrottlerException } = require('@nestjs/throttler');
      const exception = new ThrottlerException();

      // Mock throttlerGuardService.get to return block info
      mockRedisThrottlerService.get.mockResolvedValue({
        ...mockThrottlerOptions,
        blockDuration: 12345,
      });
      mockResponse.setHeader = jest.fn();

      await filter.catch(exception, mockHost());

      expect(mockRedisThrottlerService.set).toHaveBeenCalled();
      expect(mockRedisThrottlerService.get).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'retry-after',
        String(12345 / 1000),
      );
      expect(mockStatus).toHaveBeenCalledWith(429);
      expect(mockJson).toHaveBeenCalled();
    });

    it('should handle ThrottlerException and set retry-after header with default block time', async () => {
      process.env.NODE_ENV = 'development';
      const { ThrottlerException } = require('@nestjs/throttler');
      const exception = new ThrottlerException();

      // Mock throttlerGuardService.get to return null
      mockRedisThrottlerService.get.mockResolvedValue(null);
      mockResponse.setHeader = jest.fn();

      await filter.catch(exception, mockHost());

      expect(mockRedisThrottlerService.set).toHaveBeenCalled();
      expect(mockRedisThrottlerService.get).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'retry-after',
        String(Number(BLOCK_REQUEST_TIME) / 1000),
      );
      expect(mockStatus).toHaveBeenCalledWith(429);
      expect(mockJson).toHaveBeenCalled();
    });

    it('should not fail if setHeader is missing', async () => {
      process.env.NODE_ENV = 'development';
      const { ThrottlerException } = require('@nestjs/throttler');
      const exception = new ThrottlerException();

      // Remove setHeader
      const req = { url: '/test-url' } as any;
      const res = {
        status: mockStatus,
        json: mockJson,
        setHeader: jest.fn(),
      } as any;

      mockRedisThrottlerService.get.mockResolvedValue(null);

      await filter.catch(exception, mockHost(req, res));

      expect(mockStatus).toHaveBeenCalledWith(429);
      expect(mockJson).toHaveBeenCalled();
    });
  });

  describe('HttpException handling', () => {
    it('should handle ServiceException with custom status and message', async () => {
      jest.clearAllMocks();
      process.env.NODE_ENV = 'development';
      const exception = new ServiceException('Custom error', 418);

      await filter.catch(exception, mockHost());
      expect(mockStatus).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(418);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 418,
          message: 'Custom error',
        }),
      );
    });
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });
});
