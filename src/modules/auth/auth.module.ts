import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordEncryption } from '../../common/passwordEncryption';
import { UserMapper } from '../user/dtos/user.mapper';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { UserRepository } from '../user/user.repository';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt/jwt.strategy';
import { LocalStrategy } from './local/local.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Module for auth-related components and services
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      global: true,
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    UserRepository,
    PrismaService,
    PasswordEncryption,
    UserMapper,
    JwtStrategy,
    LocalStrategy,
  ],
})
export class AuthModule {}
