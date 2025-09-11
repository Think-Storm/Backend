import { errorMessages } from '../enums/errorMessages';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';

export class ServiceException extends Error {
  status: string;
  isOperational: boolean;

  constructor(
    public message: string,
    public statusCode: number,
    public error?: object,
  ) {
    super(message);
    this.status = `${this.statusCode}`.startsWith('4') ? 'Fail' : 'Error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static BadRequestException = (message: string): ServiceException => {
    return new ServiceException(message, 400);
  };

  static UnAuthorizedException = (message: string): ServiceException => {
    return new ServiceException(message, 401);
  };

  static ForbiddenException = (message: string): ServiceException => {
    return new ServiceException(message, 403);
  };

  static EntityNotFoundException = (message: string): ServiceException => {
    return new ServiceException(message, 404);
  };

  static ThrottlerException = (message: string): ServiceException => {
    return new ServiceException(message, 429);
  };

  static ErrorException = (message: string, error: Error): ServiceException => {
    if (error instanceof PrismaClientValidationError) {
      return new ServiceException(
        errorMessages.VALIDATION_ERROR + ' ' + message,
        400,
        error,
      );
    } else if (error instanceof PrismaClientKnownRequestError) {
      const prismaError = error as PrismaClientKnownRequestError;
      switch (prismaError.code) {
        case 'P2025': // Record not found
          return new ServiceException(
            errorMessages.ENTITY_NOT_FOUND('Record', '') + ' ' + message,
            404,
            error,
          );
        case 'P2002': // Unique constraint violation
          return new ServiceException(
            errorMessages.USER_WITH_EMAIL_ALREADY_EXISTS + ' ' + message,
            409,
            error,
          );
        case 'P2003': // Foreign key constraint violation
          return new ServiceException(
            errorMessages.FOREIGN_KEY_CONSTRAINT_VIOLATION + ' ' + message,
            500,
            error,
          );
        default:
          return new ServiceException(
            errorMessages.BAD_REQUEST + ' ' + message,
            400,
            error,
          );
      }
    } else {
      return new ServiceException(
        errorMessages.SERVER_ERROR + ' ' + message,
        500,
        error,
      );
    }
  };
}
