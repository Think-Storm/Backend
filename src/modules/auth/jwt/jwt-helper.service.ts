import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PasswordEncryption } from '../../../common/encryption/passwordEncryption';
import { UserRepository } from '../../user/user.repository';
import { Request } from 'express';
import { ServiceException } from '../../../common/exception-filter/serviceException';
import { errorMessages } from '../../../common/enums/errorMessages';
import { User } from '@prisma/client';

@Injectable()
export class JwtHelperService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly passwordEncryption: PasswordEncryption,
  ) {}

  checkTokenExists(req: Request): string {
    let token: string | undefined;

    if (
      req.headers?.authorization &&
      req.headers?.authorization.startsWith('Bearer ')
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
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
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

  async checkUserPasswordChanged(user: User, tokenIssuedAt: number) {
    const changedPasswordAfter =
      await this.passwordEncryption.changedPasswordAfter(user, tokenIssuedAt);
    if (changedPasswordAfter) {
      throw ServiceException.UnAuthorizedException(
        errorMessages.USER_CHANGED_PASSWORD,
      );
    }
  }
}
