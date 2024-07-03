import { AuthService } from './auth.service';
import { Controller, Post, Body } from '@nestjs/common';
import { loginUserDto } from './dtos/loginUser.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(@Body() body: loginUserDto) {
    return this.authService.login(body);
  }
}
