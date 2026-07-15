import { CanActivate, ExecutionContext, Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip on @Public() routes — AuthGuard already allowed them through
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      // No role restriction beyond authentication (which AuthGuard already enforced)
      return true;
    }

    // AuthGuard runs first and attaches the verified session — read it directly
    const request = context.switchToHttp().getRequest();
    const session = request.session;
    if (!session) {
      // Should not reach here in normal flow; AuthGuard would have blocked first
      throw new UnauthorizedException('Unauthorized: Authentication required');
    }

    let role = 'Viewer'; // default fallback

    if (session.sub === 'demo-user') {
      role = 'Owner';
    } else if (session.authType === 'otp') {
      // Look up user role by phone if logged in via OTP
      const user = await this.prisma.user.findFirst({
        where: { phone: session.phone }
      });
      if (user) {
        role = user.role;
      }
    } else {
      const user = await this.prisma.user.findUnique({
        where: { id: session.sub }
      });
      if (user) {
        role = user.role;
      }
    }

    if (!requiredRoles.includes(role)) {
      throw new ForbiddenException('Forbidden resource: insufficient permissions');
    }
    return true;
  }

}

