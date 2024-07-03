import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordEncryption } from '../../common/passwordEncryption';
import { UserMapper } from '../user/dtos/user.mapper';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { UserRepository } from '../user/user.repository';

/**
 * Module for user-related components and services
 */
@Module({
  imports: [],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    UserRepository,
    PrismaService,
    PasswordEncryption,
    UserMapper,
  ],
})
export class AuthModule {}
