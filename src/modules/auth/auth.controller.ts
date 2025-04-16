import { AuthService } from './auth.service';
import {
  Controller,
  Post,
  Res,
  UseGuards,
  HttpCode,
  Body,
} from '@nestjs/common';
import { Response } from 'express';
import { LocalAuthGuard } from './local/local.guard';
import { CreateUserDto } from '../user/dtos/createUser.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { loginUserDto } from '../auth/dtos/loginUser.dto';
import { JwtAuthGuard } from './jwt/jwt.guard';
import { GetUser } from './decorators/getUser.decorator';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: loginUserDto })
  @ApiResponse({ status: 200, description: 'Login success' })
  @ApiResponse({
    status: 400,
    description: 'Email or Password was not requested',
  })
  @ApiResponse({
    status: 401,
    description: 'Email does not exist or Password is not correct',
  })
  async login(@GetUser() user: any, @Res() res: Response): Promise<any> {
    const loggedInUser = this.authService.authentication(user, res);

    return res.send({
      message: 'login success',
      data: loggedInUser,
    });
  }

  @HttpCode(201)
  @Post('/register')
  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Register success' })
  @ApiResponse({ status: 400, description: 'User already exists' })
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

  @HttpCode(200)
  @Post('/logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'User log out' })
  @ApiResponse({ status: 200, description: 'Logout success' })
  @ApiResponse({
    status: 401,
    description: 'Logout is possible only when the user is logged in',
  })
  async logout(@Res() res: Response): Promise<any> {
    const { token, ...cookieOption } = await this.authService.logout();
    res.cookie('jwt', token, cookieOption);

    return res.send({
      message: 'logout success',
    });
  }
}
