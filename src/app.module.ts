import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { RouterModule } from '@nestjs/core';
import { ProjectModule } from './modules/project/project.module';

@Module({
  imports: [
    UserModule,
    ProjectModule,
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
