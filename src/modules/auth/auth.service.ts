import { BadRequestException, Injectable } from '@nestjs/common';
import { PasswordEncryption } from '../../common/passwordEncryption';
import { UserMapper } from '../user/dtos/user.mapper';
import { AuthRepository } from './auth.repository';
import { loginUserDto } from './dtos/loginUser.dto';
import { UserResponseDto } from '../user/dtos/userResponse.dto';
import { UserRepository } from './../user/user.repository';
import { errorMessages } from 'src/common/enums/errorMessages';

@Injectable()
export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private userRepository: UserRepository,
    private passwordEncryption: PasswordEncryption,
    private userMapper: UserMapper,
  ) {}

  async login(loginUserDto: loginUserDto): Promise<UserResponseDto> {
    // 1) Check if email and password exist
    if (!loginUserDto.email || !loginUserDto.password) {
      throw new BadRequestException(errorMessages.BAD_REQUEST_LOGIN_ERROR);
    }

    return this.authRepository.login(loginUserDto);
  }
}
