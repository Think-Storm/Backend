import { ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

export const mockJwtAuthGuard = (mockUser: User) => ({
  canActivate: (context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    request.user = mockUser;
    return true;
  },
});
