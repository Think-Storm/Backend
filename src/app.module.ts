import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { RouterModule } from '@nestjs/core';

@Module({
  imports: [
    UserModule,
    RouterModule.register([
      {
        path: 'users',
        module: UserModule,
      },
    ]),
  ],
})
export class AppModule {}