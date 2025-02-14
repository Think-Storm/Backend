import {
  Catch,
  ExceptionFilter,
  ExecutionContext,
  HttpException,
} from '@nestjs/common';
import { ServiceException } from './serviceException';
import { Request, Response } from 'express';
import { errorMessages } from '../enums/errorMessages';
import { RedisThrottlerStorageService } from '../throttler/redisThrottlerStorage.service';
import { generateIp } from '../throttler/throttlerOptions';
import { ThrottlerException } from '@nestjs/throttler';
import { BLOCK_REQUEST_TIME } from '../consts';

@Catch(ServiceException, HttpException)
export class ServiceExceptionToHttpExceptionFilter implements ExceptionFilter {
  constructor(private throttlerGuardService: RedisThrottlerStorageService) {}

  async catch(exception: any, context: ExecutionContext): Promise<void> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    if (exception instanceof ServiceException) {
      const { status, statusCode, message, stack, isOperational, error } =
        exception;

      const sendErrorDev = async () => {
        if (isOperational) {
          //send retry-after header if status is 429 (rate limiting error)
          if (statusCode === 429) {
            const realIp = generateIp(context);
            const blockedIpData = await this.throttlerGuardService.get(realIp);
            response.setHeader(
              'retry-after',
              String(Number(blockedIpData.blockDuration) / 1000),
            );
          }
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
        await sendErrorDev();
        return;
      } else if (process.env.NODE_ENV === 'production') {
        sendErrorProd();
        return;
      }
    }
    if (exception instanceof ThrottlerException) {
      const errorResponse = {
        statusCode: exception.getStatus(),
        status: 'Fail',
        message: errorMessages.THROTTLER_BLOCK,
        path: request.url,
        timestamp: new Date().toISOString(),
        stack: exception.stack,
      };

      const realIp = generateIp(context);

      // Handle throttling asynchronously
      await this.throttlerGuardService.set(realIp);
      const blockedIpData = await this.throttlerGuardService.get(realIp);
      if (blockedIpData) {
        response.setHeader(
          'retry-after',
          String(Number(blockedIpData.blockDuration) / 1000),
        );
      } else {
        response.setHeader(
          'retry-after',
          String(Number(BLOCK_REQUEST_TIME) / 1000),
        );
      }

      response.status(exception.getStatus()).json(errorResponse);
    }
  }
}
