import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt/jwt.strategy';
import { LocalStrategy } from './local/local.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { UserMapper } from '../user/dtos/user.mapper';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordEncryption } from '../../common/encryption/passwordEncryption';
import { NotificationModule } from '../notification/notification.module';
import { MailService } from '../mail/mail.service';
import { JwtHelperService } from './jwt/jwt-helper.service';
/**
 * Module for auth-related components and services
 */
@Global()
@Module({
  imports: [
    UserModule,
    NotificationModule,
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
    UserMapper,
    PrismaService,
    PasswordEncryption,
    JwtStrategy,
    JwtHelperService,
    LocalStrategy,
    MailService,
    ConfigService,
  ],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}
