import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const getUserFactory = (data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
};

export const GetUser = createParamDecorator(getUserFactory);
