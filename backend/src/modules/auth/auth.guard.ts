import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SESSION_COOKIE_NAME, verifySessionToken } from '../../lib/auth';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    
    if (!token) {
      throw new UnauthorizedException('Unauthorized');
    }

    const session = await verifySessionToken(token);
    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    request.session = session;
    return true;
  }

  private extractToken(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }

    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) return undefined;

    const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
    return match?.[1];
  }
}
