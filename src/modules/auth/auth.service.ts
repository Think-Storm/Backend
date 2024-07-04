import { Injectable } from '@nestjs/common';
import { PasswordEncryption } from '../../common/passwordEncryption';
import { UserMapper } from '../user/dtos/user.mapper';
import { AuthRepository } from './auth.repository';
import { UserRepository } from './../user/user.repository';
import { errorMessages } from 'src/common/enums/errorMessages';
import { ServiceException } from './../../common/exception-filter/serviceException';
import { JwtService } from '@nestjs/jwt';
import { UserResponseDto } from '../user/dtos/userResponse.dto';

@Injectable()
export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private userRepository: UserRepository,
    private passwordEncryption: PasswordEncryption,
    private userMapper: UserMapper,
    private readonly jwtService: JwtService,
  ) {}

  checkUserAndPassword = async (email: string, password: string) => {
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

  signToken = (id: number) => {
    return this.jwtService.sign({ id });
  };

  verifyToken = async (token, secret) => {
    return await this.jwtService.verify(token, { secret });
  };

  getToken(user: UserResponseDto): string {
    // 3) If everything is okay, send jwt token
    const token = this.signToken(user.id);

    return token;
  }
}
