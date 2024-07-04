import { BadRequestException, Injectable } from '@nestjs/common';
import { PasswordEncryption } from '../../common/passwordEncryption';
import { UserMapper } from '../user/dtos/user.mapper';
import { AuthRepository } from './auth.repository';
import { loginUserDto } from './dtos/loginUser.dto';
import { UserResponseDto } from '../user/dtos/userResponse.dto';
import { UserRepository } from './../user/user.repository';
import { errorMessages } from 'src/common/enums/errorMessages';
import { ServiceException } from './../../common/exception-filter/serviceException';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private userRepository: UserRepository,
    private passwordEncryption: PasswordEncryption,
    private userMapper: UserMapper,
    private readonly jwtService: JwtService,
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

  signToken = (id: number) => {
    return this.jwtService.sign({ id });
  };

  verifyToken = async (token, secret) => {
    return await this.jwtService.verify(token, { secret });
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
    const token = this.signToken(user.id);

    user.password = undefined;
    user.passwordSalt = undefined;

    return {
      token,
      ...user,
    };
  }

  protect = async (req: Request) => {
    // 1) Getting token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw ServiceException.AuthException(errorMessages.PROTECT_ROUTES);
    }
    // 2) Verification token
    let decoded;
    try {
      decoded = await this.verifyToken(token, process.env.JWT_SECRET);
    } catch (err) {
      console.log(err.name);
      if (err.name === 'TokenExpiredError') {
        throw ServiceException.AuthException(errorMessages.TOKEN_EXPIRED);
      } else if (err.name === 'JsonWebTokenError') {
        throw ServiceException.AuthException(errorMessages.INVALID_TOKEN);
      }
    }

    // 3) Check if user still exists
    const user = await this.userRepository.getUserById(decoded.id);
    if (!user) {
      throw ServiceException.AuthException(
        errorMessages.ENTITY_NOT_FOUND(decoded.id),
      );
    }
    // 4) Check if user changed password after the token was issued
    const changedPasswordAfter =
      await this.passwordEncryption.changedPasswordAfter(user, decoded.iat);
    if (changedPasswordAfter) {
      throw ServiceException.AuthException(errorMessages.USER_CHANGED_PASSWORD);
    }
  };
}
