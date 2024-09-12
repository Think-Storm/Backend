import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRepository } from './user.repository';
import { PasswordEncryption } from '../../common/passwordEncryption';
import { UserMapper } from './dtos/user.mapper';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Module for user-related components and services
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    UserMapper,
    PrismaService,
    PasswordEncryption,
    ConfigService,
  ],
  exports: [UserService, UserRepository, UserMapper],
})
export class UserModule {}
