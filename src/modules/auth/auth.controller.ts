import { AuthService } from './auth.service';
import {
  Controller,
  Post,
  Res,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { LocalAuthGuard } from './local/local.guard';
import RequestWithUser from './local/requestwithUser.interface';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(@Req() req: RequestWithUser, @Res() res: Response): Promise<any> {
    const user = req.user;
    const token = this.authService.getToken(user);
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

    return res.send({
      message: 'success',
      data: user,
    });
  }
}
