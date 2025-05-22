import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { UserResponseDto } from '../../../modules/user/dtos/userResponse.dto';
import { JwtHelperService } from './jwt-helper.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private jwtHelper: JwtHelperService) {
    super();
  }

  async validate(req: Request): Promise<UserResponseDto> {
    // 1) Getting token and check if it's there
    const token = this.jwtHelper.checkTokenExists(req);

    // 2) Verification token
    const decoded = await this.jwtHelper.verifyAndDecodeToken(token);

    // 3) Check if user still exists
    const user = await this.jwtHelper.checkUserExistsInDB(decoded.id);

    // 4) Check if user changed password after the token was issued
    await this.jwtHelper.checkUserPasswordChanged(user, decoded.iat);

    return user;
  }
}
