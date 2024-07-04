import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import { errorMessages } from '../../../common/enums/errorMessages';
import { ServiceException } from '../../../common/exception-filter/serviceException';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private authService: AuthService) {
    super({
      // 1) Getting token and check if it's there
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          let token = null;
          if (request.cookies.jwt) {
            token = request.cookies.jwt;
          } else if (
            request.headers.authorization &&
            request.headers.authorization.startsWith('Bearer')
          ) {
            token = request.headers.authorization.split(' ')[1];
          }

          if (!token) {
            throw ServiceException.AuthException(errorMessages.PROTECT_ROUTES);
          }
          return token;
        },
      ]),
      secretOrKey: process.env.JWT_SECRET,
      ignoreExpiration: false,
    });
  }

  async validate(payload: Payload, done: VerifiedCallback): Promise<any> {
    // 3) Check if user still exists
    const user = await this.authService.tokenValidateUser(payload);

    return done(null, user);
  }
}

export interface Payload {
  id: number;
  //role:string
}
