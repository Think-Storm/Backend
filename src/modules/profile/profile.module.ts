import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ProfileRepository } from './profile.repository';
import { UserModule } from '../user/user.module';
import { ProfileMapper } from './dtos/profile.mapper';

@Module({
  imports: [UserModule],
  controllers: [ProfileController],
  providers: [ProfileService, ProfileRepository, ProfileMapper],
  exports: [ProfileService],
})
export class ProfileModule {}
