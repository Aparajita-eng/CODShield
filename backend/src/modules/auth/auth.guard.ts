import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import { SESSION_COOKIE_NAME, verifySessionToken } from '../../lib/auth';

/**
 * Global authentication guard registered via APP_GUARD.
 * - Routes decorated with @Public() bypass this guard entirely.
 * - All other routes require a valid session token (Bearer or cookie).
 * - An expired or tampered token throws 401 even on routes with no @Roles() annotation.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Short-circuit for @Public() routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Unauthorized: Authentication required');
    }

    const session = await verifySessionToken(token);
    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    // Attach verified session to request so downstream handlers can read it
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
