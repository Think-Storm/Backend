import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { errorMessages } from '../../../common/enums/errorMessages';
import { ServiceException } from '../../../common/exception-filter/serviceException';
import { AuthService } from '../auth.service';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { UserRepository } from './../../user/user.repository';
import { PasswordEncryption } from './../../../common/passwordEncryption';
import { UserResponseDto } from '../../../modules/user/dtos/userResponse.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private authService: AuthService,
    private userRepository: UserRepository,
    private passwordEncryption: PasswordEncryption,
  ) {
    super();
  }

  async validate(req: Request): Promise<UserResponseDto> {
    // 1) Getting token and check if it's there
    let token;
    if (
      req.headers?.authorization &&
      req.headers?.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      throw ServiceException.AuthException(errorMessages.PROTECT_ROUTES);
    }

    // 2) Verification token
    let decoded;
    try {
      decoded = await this.authService.verifyToken(
        token,
        process.env.JWT_SECRET,
      );
    } catch (err) {
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
        errorMessages.ENTITY_NOT_FOUND('User', decoded.id),
      );
    }

    // 4) Check if user changed password after the token was issued
    const changedPasswordAfter =
      await this.passwordEncryption.changedPasswordAfter(user, decoded.iat);
    if (changedPasswordAfter) {
      throw ServiceException.AuthException(errorMessages.USER_CHANGED_PASSWORD);
    }

    return user;
  }
}
