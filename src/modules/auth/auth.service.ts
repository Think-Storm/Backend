import { Injectable } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import { PasswordEncryption } from '../../common/passwordEncryption';
import { UserMapper } from '../user/dtos/user.mapper';

@Injectable()
export class authService {
  constructor(
    private userRepository: UserRepository,
    private passwordEncryption: PasswordEncryption,
    private userMapper: UserMapper,
  ) {}
}
