import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ServiceExceptionToHttpExceptionFilter } from './common/exception-filter/serviceExceptionFilter';
import { ServiceException } from './common/exception-filter/serviceException';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RedisThrottlerStorageService } from './common/throttler/redisThrottlerStorage.service';
import { RedisService } from './common/throttler/redisThrottler.service';
import { ConfigService } from '@nestjs/config';
import { PrismaExceptionFilter } from './common/exception-filter/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  const configService = app.get(ConfigService);
  const redisService = new RedisService(configService);
  const redisThrottlerStorageService = new RedisThrottlerStorageService(
    redisService,
  );
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => {
        const errMsg = errors
          .map((error) => Object.values(error.constraints).join(''))
          .filter((error) => error)
          .join('. ');

        return new ServiceException(`${errMsg}.`, 400, errors);
      },
      stopAtFirstError: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(
    new ServiceExceptionToHttpExceptionFilter(),
    new PrismaExceptionFilter(),
  );
  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('ThinkStorm API')
    .setDescription('Here are the API endpoints for the ThinkStorm API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3001);
}
bootstrap();
