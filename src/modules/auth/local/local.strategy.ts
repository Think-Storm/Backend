import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { loginUserDto } from '../dtos/loginUser.dto';
import { ServiceException } from './../../../common/exception-filter/serviceException';
import { errorMessages } from 'src/common/enums/errorMessages';
import { UserResponseDto } from 'src/modules/user/dtos/userResponse.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<UserResponseDto> {
    const loginUserDto: loginUserDto = {
      email,
      password,
    };

    // 1) Check if email and password exist
    if (!loginUserDto.email || !loginUserDto.password) {
      throw ServiceException.BadRequestException(
        errorMessages.BAD_REQUEST_LOGIN_ERROR,
      );
    }

    // 2) Check if user exists && password is correct
    const user = await this.authService.checkUserAndPassword(
      loginUserDto.email,
      loginUserDto.password,
    );

    user.password = undefined;
    user.passwordSalt = undefined;
    user.passwordChangedAt = undefined;

    return user;
  }
}
