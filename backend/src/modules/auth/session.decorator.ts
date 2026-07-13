import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SessionPayload } from '../../lib/auth';

export const ReqSession = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SessionPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.session;
  },
);
