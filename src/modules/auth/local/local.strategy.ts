import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { AuthService } from '../auth.service';
import { loginUserDto } from '../dtos/loginUser.dto';
import { ServiceException } from './../../../common/exception-filter/serviceException';
import { errorMessages } from '../../../../src/common/enums/errorMessages';
import { UserResponseDto } from '../../../../src/modules/auth/dtos/userResponse.dto';
import { Request } from 'express';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(req: Request): Promise<UserResponseDto> {
    const loginUserDto: loginUserDto = {
      email: req.body.email,
      password: req.body.password,
    };

    // 1) Check if email and password exist
    this.checkEmailAndPasswordExist(loginUserDto.email, loginUserDto.password);

    // 2) Check if user exists && password is correct
    const user = await this.verifyUserAndPassword(
      loginUserDto.email,
      loginUserDto.password,
    );

    user.password = undefined;
    user.passwordSalt = undefined;
    user.passwordChangedAt = undefined;

    return user;
  }

  checkEmailAndPasswordExist(email: string, password: string) {
    if (!email || !password) {
      throw ServiceException.BadRequestException(
        errorMessages.BAD_REQUEST_LOGIN_ERROR,
      );
    }
  }

  async verifyUserAndPassword(email: string, password: string) {
    const user = await this.authService.checkUserAndPassword(email, password);
    return user;
  }
}
