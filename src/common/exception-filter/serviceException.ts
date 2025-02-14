import { Prisma } from '@prisma/client';
import { errorMessages } from '../enums/errorMessages';

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
    if (error instanceof Prisma.PrismaClientValidationError) {
      return new ServiceException(
        errorMessages.VALIDATION_ERROR + ' ' + message,
        400,
        error,
      );
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return new ServiceException(
        errorMessages.BAD_REQUEST + ' ' + message,
        400,
        error,
      );
    } else {
      return new ServiceException(
        errorMessages.SERVER_ERROR + ' ' + message,
        500,
        error,
      );
    }
  };
}
