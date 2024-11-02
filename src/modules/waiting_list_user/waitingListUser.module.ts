import { Module } from '@nestjs/common';
import { WaitingListUserController } from './waitingListUser.controller';
import { WaitingListUserService } from './waitingListUser.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WaitingListUserRepository } from './waitingListUser.repository';
import { WaitingListUserMapper } from './dtos/waitingListUser.mapper';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Module for waiting-list-related components and services
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [WaitingListUserController],
  providers: [
    WaitingListUserService,
    WaitingListUserRepository,
    WaitingListUserMapper,
    PrismaService,
    ConfigService,
  ],
})
export class WaitingListUserModule {}
