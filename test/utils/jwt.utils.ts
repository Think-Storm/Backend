import { UserResponseDto } from '../../src/modules/user/dtos/userResponse.dto';

export const mockJwtToken = 'mock.jwt.token';

export const mockJwtPayload = {
  sub: 1,
  email: 'test@example.com',
  username: 'testuser',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour from now
};

export interface RequestWithUser extends Request {
  user: UserResponseDto;
}

export const createMockRequestWithUser = (
  user: UserResponseDto,
): RequestWithUser =>
  ({
    user,
    // Add other Request properties as needed
  }) as RequestWithUser;
