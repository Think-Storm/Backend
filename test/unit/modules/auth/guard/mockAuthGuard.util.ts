import { ExecutionContext } from '@nestjs/common';

export const mockAuthGuard = {
  canActivate: (context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    request['user'] = { id: 1 };
    return true;
  },
};
