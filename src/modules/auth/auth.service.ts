import { BadRequestException, Injectable } from '@nestjs/common';
import { PasswordEncryption } from '../../common/passwordEncryption';
import { UserMapper } from '../user/dtos/user.mapper';
import { AuthRepository } from './auth.repository';
import { loginUserDto } from './dtos/loginUser.dto';
import { UserResponseDto } from '../user/dtos/userResponse.dto';
import { UserRepository } from './../user/user.repository';
import { errorMessages } from 'src/common/enums/errorMessages';
import { ServiceException } from './../../common/exception-filter/serviceException';

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

    // 2) Check if user exists && password is correct
    const user = await this.userRepository.getUserByEmail(loginUserDto.email);
    if (!user) {
      throw ServiceException.EntityNotFoundException(
        errorMessages.ENTITY_NOT_FOUND(loginUserDto.email),
      );
    }

    return this.authRepository.login(loginUserDto);
  }
}
