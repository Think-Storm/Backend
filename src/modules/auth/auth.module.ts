import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordEncryption } from '../../common/passwordEncryption';
import { UserMapper } from '../user/dtos/user.mapper';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';

/**
 * Module for user-related components and services
 */
@Module({
  imports: [],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    PrismaService,
    PasswordEncryption,
    UserMapper,
  ],
})
export class AuthModule {}
