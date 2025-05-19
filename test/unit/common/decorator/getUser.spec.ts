import { ExecutionContext } from '@nestjs/common';
import { getUserFactory } from '../../../../src/modules/auth/decorators/getUser.decorator';

describe('GetUser Decorator', () => {
  it('should return user from request object', () => {
    const mockUser = { id: 42, username: 'testuser' };
    const mockRequest = { user: mockUser };

    const mockContext: ExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any;

    const result = getUserFactory(null, mockContext);
    expect(result).toEqual(mockUser);
  });
});
