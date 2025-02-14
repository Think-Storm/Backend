import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRepository } from './user.repository';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserMapper } from '../user/dtos/user.mapper';
import { PasswordEncryption } from '../../common/encryption/passwordEncryption';

/**
 * Module for user-related components and services
 */
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [UserController],
  providers: [
    UserService,
    UserMapper,
    UserRepository,
    PrismaService,
    PasswordEncryption,
    ConfigService,
  ],
  exports: [UserService, UserRepository],
})
export class UserModule {}
