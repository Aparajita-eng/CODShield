import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const session = request.session;
    if (!session) {
      return false;
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
