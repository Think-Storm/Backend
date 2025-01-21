import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { RouterModule } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectModule } from './modules/project/project.module';
import { CommonDataModule } from './modules/common-data/common-data.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    UserModule,
    ProjectModule,
    CommonDataModule,
    AuthModule,
    RouterModule.register([
      {
        path: 'users',
        module: UserModule,
      },
      {
        path: 'projects',
        module: ProjectModule,
      },
      {
        path: 'common-data',
        module: CommonDataModule,
      },
    ]),
  ],
})
export class AppModule {}
