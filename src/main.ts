import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ServiceExceptionToHttpExceptionFilter } from './common/exception-filter/serviceExceptionFilter';
import { ServiceException } from './common/exception-filter/serviceException';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => {
        const errMsg = errors
          .map((error) => Object.values(error.constraints).join(''))
          .join('. ');

        return new ServiceException(`${errMsg}.`, 400, errors);
      },
      stopAtFirstError: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ServiceExceptionToHttpExceptionFilter());
  await app.listen(3000);
}
bootstrap();
