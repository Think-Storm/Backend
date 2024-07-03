import { BadRequestException, Injectable } from '@nestjs/common';
import { PasswordEncryption } from '../../common/passwordEncryption';
import { UserMapper } from '../user/dtos/user.mapper';
import { AuthRepository } from './auth.repository';
import { loginUserDto } from './dtos/loginUser.dto';
import { UserResponseDto } from '../user/dtos/userResponse.dto';
import { UserRepository } from './../user/user.repository';
import { errorMessages } from 'src/common/enums/errorMessages';
import { ServiceException } from './../../common/exception-filter/serviceException';
import { jwt } from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private userRepository: UserRepository,
    private passwordEncryption: PasswordEncryption,
    private userMapper: UserMapper,
  ) {}

  checkUserAndPassword = async (email, password) => {
    const user = await this.userRepository.getUserByEmail(email);

    if (
      !user ||
      !(await this.passwordEncryption.correctPassword(password, user.password))
    ) {
      throw ServiceException.AuthException(
        errorMessages.INCORRECT_EMAIL_OR_PASSWORD,
      );
    }

    return user;
  };

  signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  };

  async login(loginUserDto: loginUserDto): Promise<UserResponseDto> {
    // 1) Check if email and password exist
    if (!loginUserDto.email || !loginUserDto.password) {
      throw new BadRequestException(errorMessages.BAD_REQUEST_LOGIN_ERROR);
    }

    // 2) Check if user exists && password is correct
    const user = await this.checkUserAndPassword(
      loginUserDto.email,
      loginUserDto.password,
    );

    // 3) If everything is okay, send jwt token via cookie
    this.signToken(user.id);

    return this.authRepository.login(loginUserDto);
  }
}
