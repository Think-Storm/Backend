import { AuthService } from './auth.service';
import {
  Controller,
  Post,
  Res,
  UseGuards,
  Req,
  HttpCode,
  Body,
} from '@nestjs/common';
import { Response } from 'express';
import { LocalAuthGuard } from './local/local.guard';
import RequestWithUser from './local/requestWithUser.interface';
import { CreateUserDto } from '../user/dtos/createUser.dto';

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
      message: 'login success',
      data: loggedInUser,
    });
  }

  @HttpCode(201)
  @Post('/register')
  async register(
    @Body() user: CreateUserDto,
    @Res() res: Response,
  ): Promise<any> {
    const newUser = await this.authService.register(user);
    const loggedInNewUser = this.authService.authentication(newUser, res);

    return res.send({
      message: 'register success',
      data: loggedInNewUser,
    });
  }
}
