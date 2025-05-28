import { PartialType } from '@nestjs/swagger';
import { CreateUserProfileDto } from './createUserProfile.dto';

export class UpdateUserProfileDto extends PartialType(CreateUserProfileDto) {}
