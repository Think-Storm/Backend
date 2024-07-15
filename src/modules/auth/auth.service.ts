import { Injectable, Res } from '@nestjs/common';
import { Response } from 'express';
import { PasswordEncryption } from '../../common/passwordEncryption';
import { UserMapper } from '../user/dtos/user.mapper';
import { AuthRepository } from './auth.repository';
import { UserRepository } from './../user/user.repository';
import { errorMessages } from '../../../src/common/enums/errorMessages';
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

  verifyToken = async (token: string, secret: string) => {
    return await this.jwtService.verify(token, { secret });
  };

  getToken(user: UserResponseDto): string {
    // 3) If everything is okay, send jwt token
    const token = this.signToken(user.id);

    return token;
  }

  authentication(user: UserResponseDto, @Res() res: Response): UserResponseDto {
    const token = this.getToken(user);
    res.setHeader('Authorization', 'Bearer ' + token);

    const cookieOptions = {
      httpOnly: true,
      secure: false,
      expires: new Date(
        Date.now() +
          Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
      ),
    };
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }

    res.cookie('jwt', token, cookieOptions);

    return user;
  }
}
