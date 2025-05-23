import { ExecutionContext } from '@nestjs/common';
import { defaultUser, defaultUserResponseDto } from './user.utils';
import { mockJwtToken } from './jwt.utils';
import { LoginUserDto } from '../../src/modules/auth/dtos/loginUser.dto';
import { UpdatePasswordDto } from '../../src/modules/auth/dtos/updatePassword.dto';
import { sign } from 'jsonwebtoken';
import { ForgotPasswordDto } from '../../src/modules/auth/dtos/forgotPassword.dto';

export const defaultLoginUserDto: LoginUserDto = {
  email: 'email@email.com',
  password: 'hashedPassword',
};

export const createMockPasswordResetToken = (userId: number = 1): string => {
  return sign(
    {
      id: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    },
    process.env.JWT_SECRET,
  );
};

export const createMockExecutionContext = (
  user = defaultUserResponseDto,
  token = mockJwtToken,
): ExecutionContext => {
  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        user,
        headers: {
          authorization: `Bearer ${token}`,
        },
      }),
      getResponse: () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  };

  return mockContext as ExecutionContext;
};

export const mockGuardContext = (
  user = defaultUserResponseDto,
): ExecutionContext => {
  return createMockExecutionContext(user);
};

export const createAuthHeader = (token = mockJwtToken) => ({
  Authorization: `Bearer ${token}`,
});

export const defaultUpdatePasswordDto: UpdatePasswordDto = {
  email: defaultUser.email,
  password: 'newpassword',
  passwordResetToken: createMockPasswordResetToken(),
};

export const defaultForgotPasswordDto: ForgotPasswordDto = {
  email: defaultUser.email,
};
