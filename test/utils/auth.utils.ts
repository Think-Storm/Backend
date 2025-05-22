import { ExecutionContext } from '@nestjs/common';
import { defaultUserResponseDto } from './user.utils';
import { mockJwtToken } from './jwt.utils';
import { LoginUserDto } from '../../src/modules/auth/dtos/loginUser.dto';

export const defaultLoginUserDto: LoginUserDto = {
  email: 'email@email.com',
  password: 'hashedPassword',
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
