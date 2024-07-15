import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { RouterModule } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectModule } from './modules/project/project.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    ProjectModule,
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
    ]),
  ],
})
export class AppModule {}
