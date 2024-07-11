import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ServiceException } from './serviceException';
import { Request, Response } from 'express';
import { errorMessages } from '../enums/errorMessages';

@Catch(ServiceException)
export class ServiceExceptionToHttpExceptionFilter implements ExceptionFilter {
  catch(exception: ServiceException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { status, statusCode, message, stack, isOperational, error } =
      exception;

    const sendErrorDev = () => {
      if (isOperational) {
        response.status(statusCode).json({
          statusCode,
          status,
          message,
          path: request.url,
          timestamp: new Date().toISOString(),
          stack,
          error,
        });
      } else {
        response.status(500).json({
          status: 'Error',
          message: errorMessages.NONE_OPERATIONAL_ERROR,
          error,
        });
      }
    };

    const sendErrorProd = () => {
      if (isOperational) {
        response.status(statusCode).json({
          status,
          message,
        });
      } else {
        response.status(500).json({
          status: 'Error',
          message: errorMessages.NONE_OPERATIONAL_ERROR,
          error,
        });
      }
    };

    if (process.env.NODE_ENV === 'development') {
      sendErrorDev();
    } else if (process.env.NODE_ENV === 'production') {
      sendErrorProd();
    }
  }
}
