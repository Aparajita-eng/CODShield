import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown-ip';
    const userId = req.session?.sub;
    if (userId) {
      return `throttle:${userId}:${ip}`;
    }
    return `throttle:anon:${ip}`;
  }
}
