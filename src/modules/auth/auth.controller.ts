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
    const loggedInUser = this.authService.authentication(user, res);

    return res.send({
      message: 'success',
      data: loggedInUser,
    });
  }
}
