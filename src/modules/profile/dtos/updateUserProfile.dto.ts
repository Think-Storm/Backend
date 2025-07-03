import { PartialType } from '@nestjs/swagger';
import { CreateUserProfileDto } from './createUserProfile.dto';
import { UpdateProfile } from '@think-storm/contracts/dist/interface/profile.interface';

export class UpdateUserProfileDto
  extends PartialType(CreateUserProfileDto)
  implements UpdateProfile {}
