import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { errorMessages } from '../../../common/enums/errorMessages';
import { ServiceException } from '../../../common/exception-filter/serviceException';
import { AuthService } from '../auth.service';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { UserRepository } from './../../user/user.repository';
import { UserResponseDto } from '../../../modules/user/dtos/userResponse.dto';
import { User } from '@prisma/client';
import { PasswordEncryption } from '../../../common/encryption/passwordEncryption';

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
    const token = this.checkTokenExists(req);

    // 2) Verification token
    const decoded = await this.verifyAndDecodeToken(token);

    // 3) Check if user still exists
    const user = await this.checkUserExistsInDB(decoded.id);

    // 4) Check if user changed password after the token was issued
    await this.checkUserPasswordChanged(user, decoded.iat);

    return user;
  }

  checkTokenExists(req: Request) {
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
      throw ServiceException.UnAuthorizedException(
        errorMessages.PROTECT_ROUTES,
      );
    }
    return token;
  }

  async verifyAndDecodeToken(token: string) {
    let decoded;
    try {
      decoded = await this.authService.verifyToken(
        token,
        process.env.JWT_SECRET,
      );
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ServiceException.UnAuthorizedException(
          errorMessages.TOKEN_EXPIRED,
        );
      } else if (err.name === 'JsonWebTokenError') {
        throw ServiceException.UnAuthorizedException(
          errorMessages.INVALID_TOKEN,
        );
      }
    }
    return decoded;
  }

  async checkUserExistsInDB(userId: number) {
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw ServiceException.UnAuthorizedException(
        errorMessages.ENTITY_NOT_FOUND('User', String(userId)),
      );
    }
    return user;
  }

  async checkUserPasswordChanged(user: User, tokenIssuedAt) {
    const changedPasswordAfter =
      await this.passwordEncryption.changedPasswordAfter(user, tokenIssuedAt);
    if (changedPasswordAfter) {
      throw ServiceException.UnAuthorizedException(
        errorMessages.USER_CHANGED_PASSWORD,
      );
    }
  }
}
