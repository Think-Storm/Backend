import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRepository } from './user.repository';
import { PasswordEncryption } from '../../common/passwordEncryption';
import { UserMapper } from './dtos/user.mapper';

/**
 * Module for user-related components and services
 */
@Module({
  imports: [],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    PrismaService,
    PasswordEncryption,
    UserMapper,
  ],
})
export class UserModule {}
