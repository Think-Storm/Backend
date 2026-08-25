import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ServiceExceptionToHttpExceptionFilter } from './common/exception-filter/serviceExceptionFilter';
import { ServiceException } from './common/exception-filter/serviceException';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RedisThrottlerStorageService } from './common/throttler/redisThrottlerStorage.service';
import { ConfigService } from '@nestjs/config';
import { PrismaExceptionFilter } from './common/exception-filter/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  app.enableCors({
    origin: [frontendUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  // Resolved from the container rather than constructed here, so the filter
  // shares the one Redis connection instead of opening a second.
  const redisThrottlerStorageService = app.get(RedisThrottlerStorageService);
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
    new ServiceExceptionToHttpExceptionFilter(redisThrottlerStorageService),
    new PrismaExceptionFilter(),
  );
  app.use(cookieParser());

  // Building the OpenAPI document costs measurable time on a cold start;
  // set SWAGGER_ENABLED=false to skip it on constrained hosts.
  if (configService.get<string>('SWAGGER_ENABLED') !== 'false') {
    const config = new DocumentBuilder()
      .setTitle('ThinkStorm API')
      .setDescription('Here are the API endpoints for the ThinkStorm API')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  // Bind on all interfaces and honour the port the platform injects — Render,
  // Koyeb and Railway route to $PORT and will not reach a loopback-only bind.
  const port = Number(configService.get<string>('PORT')) || 3001;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
