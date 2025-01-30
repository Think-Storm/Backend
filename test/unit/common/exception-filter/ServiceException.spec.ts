import { ServiceException } from '../../../../src/common/exception-filter/serviceException';
import { Prisma } from '@prisma/client';
import { errorMessages } from '../../../../src/common/enums/errorMessages';

describe('ServiceException', () => {
  describe('constructor', () => {
    it('should create error with fail status for 4xx codes', () => {
      const error = new ServiceException('test error', 400);
      expect(error.status).toBe('Fail');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('test error');
      expect(error.isOperational).toBe(true);
    });

    it('should create error with error status for 5xx codes', () => {
      const error = new ServiceException('server error', 500);
      expect(error.status).toBe('Error');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('server error');
      expect(error.isOperational).toBe(true);
    });

    it('should include error object when provided', () => {
      const originalError = new Error('original error');
      const error = new ServiceException('test error', 400, originalError);
      expect(error.error).toBe(originalError);
    });
  });

  describe('static methods', () => {
    it('should create BadRequestException', () => {
      const error = ServiceException.BadRequestException('bad request');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('bad request');
    });

    it('should create UnAuthorizedException', () => {
      const error = ServiceException.UnAuthorizedException('unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('unauthorized');
    });

    it('should create ForbiddenException', () => {
      const error = ServiceException.ForbiddenException('forbidden');
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('forbidden');
    });

    it('should create EntityNotFoundException', () => {
      const error = ServiceException.EntityNotFoundException('not found');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('not found');
    });

    it('should create ThrottlerException', () => {
      const error = ServiceException.ThrottlerException('too many requests');
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('too many requests');
    });

    describe('ErrorException', () => {
      it('should handle PrismaClientValidationError', () => {
        const prismaError = new Prisma.PrismaClientValidationError(
          'validation error',
          {
            clientVersion: '5.0.0',
          },
        );
        const error = ServiceException.ErrorException(
          'test error',
          prismaError,
        );

        expect(error.statusCode).toBe(400);
        expect(error.message).toBe(
          `${errorMessages.VALIDATION_ERROR} test error`,
        );
        expect(error.error).toBe(prismaError);
      });

      it('should handle PrismaClientKnownRequestError', () => {
        const prismaError = new Prisma.PrismaClientKnownRequestError(
          'known error',
          {
            code: 'P2002',
            clientVersion: '5.0.0',
          },
        );

        const error = ServiceException.ErrorException(
          'test error',
          prismaError,
        );

        expect(error.statusCode).toBe(409);
        expect(error.message).toBe(
          `${errorMessages.USER_WITH_EMAIL_ALREADY_EXISTS} test error`,
        );
        expect(error.error).toBe(prismaError);
      });

      it('should handle generic errors', () => {
        const genericError = new Error('generic error');
        const error = ServiceException.ErrorException(
          'test error',
          genericError,
        );

        expect(error.statusCode).toBe(500);
        expect(error.message).toBe(`${errorMessages.SERVER_ERROR} test error`);
        expect(error.error).toBe(genericError);
      });
    });
  });

  describe('error inheritance', () => {
    it('should inherit from Error', () => {
      const error = new ServiceException('test error', 400);
      expect(error).toBeInstanceOf(Error);
      expect(error.stack).toBeDefined();
    });

    it('should capture stack trace', () => {
      const error = new ServiceException('test error', 400);
      expect(error.stack).toContain('ServiceException');
    });
  });
});
