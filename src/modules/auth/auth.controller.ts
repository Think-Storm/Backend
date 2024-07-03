import { AuthService } from './auth.service';
import { Controller, Post, Body, Res } from '@nestjs/common';
import { loginUserDto } from './dtos/loginUser.dto';
import { Response } from 'express';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(@Body() body: loginUserDto, @Res() res: Response): Promise<any> {
    const loginSuccessDto = await this.authService.login(body);
    res.setHeader('Authorization', 'Bearer ' + loginSuccessDto.token);

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

    res.cookie('jwt', loginSuccessDto.token, cookieOptions);

    return res.send({
      message: 'success',
      data: loginSuccessDto,
    });
  }
}
