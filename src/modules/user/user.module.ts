import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRepository } from './user.repository';
import { PasswordEncryption } from '../../common/passwordEncryption';
import { UserMapper } from './dtos/user.mapper';
import { AuthService } from '../auth/auth.service';
import { AuthRepository } from '../auth/auth.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Module for user-related components and services
 */
@Module({
  imports: [],
  controllers: [UserController],
  providers: [
    AuthService,
    AuthRepository,
    UserService,
    UserRepository,
    PrismaService,
    PasswordEncryption,
    UserMapper,
    JwtService,
    ConfigService,
  ],
})
export class UserModule {}
