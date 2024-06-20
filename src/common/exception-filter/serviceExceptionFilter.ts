import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ServiceException } from './serviceException';
import { Request, Response } from 'express';

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
          message: 'Something went very wrong!',
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
          message: 'Something went very wrong!',
        });
      }
    };

    console.log(exception);
    if (process.env.NODE_ENV === 'development') {
      sendErrorDev();
    } else if (process.env.NODE_ENV === 'production') {
      sendErrorProd();
    }
  }
}
