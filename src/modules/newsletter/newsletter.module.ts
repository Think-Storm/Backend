import { Module } from '@nestjs/common';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './newsletter.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NewsletterRepository } from './newsletter.repository';
import { NewsletterMapper } from './dtos/newsletter.mapper';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [NewsletterController],
  providers: [
    NewsletterService,
    NewsletterRepository,
    NewsletterMapper,
    PrismaService,
    ConfigService,
  ],
})
export class NewsletterModule {}
