import { ArgumentsHost } from '@nestjs/common';
import { ServiceExceptionToHttpExceptionFilter } from '../../../../src/common/exception-filter/serviceExceptionFilter';
import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { errorMessages } from '../../../../src/common/enums/errorMessages';
import { createMock } from '@golevelup/ts-jest';
import { Request, Response } from 'express';

describe('ServiceExceptionToHttpExceptionFilter', () => {
  let filter: ServiceExceptionToHttpExceptionFilter;
  let mockResponse: Response;
  let mockRequest: Request;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    } as any;

    mockRequest = {
      url: '/test-url',
    } as any;

    filter = new ServiceExceptionToHttpExceptionFilter();
  });

  const mockHost = (req = mockRequest, res = mockResponse): ArgumentsHost => {
    return createMock<ArgumentsHost>({
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    });
  };

  describe('catch in development environment', () => {
    beforeEach(() => {
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

    afterEach(() => {
      delete process.env.NODE_ENV;
    });
  });
});
