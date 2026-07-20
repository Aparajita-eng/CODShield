import {
  Controller,
  Post,
  Body,
  UseGuards,
  ForbiddenException,
  Req,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '../auth/auth.guard';
import { ReqSession } from '../auth/session.decorator';
import { CustomThrottlerGuard } from '../../common/guards/custom-throttler.guard';
import { hashApiKey, signSessionToken, signRefreshToken } from '../../lib/auth';
import { LinkKeyDto } from './dto/link-key.dto';
import { isDemoDataMode, demoMerchants } from '../../lib/demoData';
import { demoUsers } from '../auth/auth.service';

@ApiTags('Merchant & Settings')
@ApiBearerAuth()
@UseGuards(AuthGuard, CustomThrottlerGuard)
@Controller('api/merchant')
export class MerchantLinkController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('link-key')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Link and verify merchant API key for current session' })
  async linkKey(
    @ReqSession() session: any,
    @Body() body: LinkKeyDto,
    @Ip() ip: string,
  ) {
    const hashed = hashApiKey(body.apiKey);

    if (isDemoDataMode()) {
      const merchant = demoMerchants.find((m) => m.apiKeyHash === hashed);
      if (!merchant) {
        console.warn(`Failed API key verification (demo mode): Merchant key hash not found. Hash Suffix: ${hashed.slice(-8)}`);
        throw new ForbiddenException({
          statusCode: 403,
          code: 'KEY_NOT_RECOGNIZED',
          message: 'Key not recognized',
        });
      }

      let user = Array.from(demoUsers.values()).find((u) => u.id === session.sub) as any;
      if (!user) {
        console.log(`User ${session.sub} not found in demoUsers (likely cleared during dev restart). Re-hydrating...`);
        const email = session.email?.toLowerCase() || `guest_${session.sub}@example.com`;
        user = {
          id: session.sub,
          email,
          name: session.name || 'Guest Merchant',
          companyName: 'Simulated Company',
          passwordHash: '',
          role: 'Owner',
        };
        demoUsers.set(email, user);
      }

      if (user.merchantId && user.merchantId !== merchant.id) {
        console.warn(`Failed API key verification (demo mode): User merchant mismatch. User Merchant: ${user.merchantId}, Key Merchant: ${merchant.id}`);
        throw new ForbiddenException({
          statusCode: 403,
          code: 'KEY_NOT_RECOGNIZED',
          message: 'Key not recognized',
        });
      }

      if (!user.merchantId) {
        user.merchantId = merchant.id;
        console.log(`Bound demo user ${user.id} to merchant ${merchant.id} in demoUsers.`);
      }

      const updatedPayload = {
        ...session,
        sessionKeyVerified: true,
      };

      const token = await signSessionToken(updatedPayload);
      const refreshToken = await signRefreshToken(updatedPayload);

      return {
        success: true,
        token,
        refreshToken,
        merchantId: merchant.id,
        merchantName: merchant.name,
        apiKeyMask: merchant.apiKeyMask,
        tier: merchant.tier,
      };
    }

    const merchant: any = await this.prisma.merchant.findFirst({
      where: { apiKeyHash: hashed } as any,
    });

    if (!merchant) {
      console.warn(
        `Failed API key verification: Merchant key hash not found. User ID: ${session.sub}, IP: ${ip}, Hash Suffix: ${hashed.slice(-8)}`
      );
      throw new ForbiddenException({
        statusCode: 403,
        code: 'KEY_NOT_RECOGNIZED',
        message: 'Key not recognized',
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.sub },
    });

    if (!user) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'KEY_NOT_RECOGNIZED',
        message: 'Key not recognized',
      });
    }

    // Case A: User already bound to a different merchant → reject
    if (user.merchantId && user.merchantId !== merchant.id) {
      console.warn(
        `Failed API key verification: User already bound to different merchant. User ID: ${session.sub}, IP: ${ip}, User Merchant: ${user.merchantId}, Key Merchant: ${merchant.id}`
      );
      throw new ForbiddenException({
        statusCode: 403,
        code: 'KEY_NOT_RECOGNIZED',
        message: 'Key not recognized',
      });
    }

    // Case B: New user with no merchantId → bind them to this merchant
    if (!user.merchantId) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { merchantId: merchant.id },
      });
      console.log(`Bound new user ${user.id} to merchant ${merchant.id} via API key linking.`);
    }

    // Session-scoped UX flag only.
    // Merchant authorization is enforced by User.merchantId.
    // This flag is NOT a security boundary.
    const updatedPayload = {
      ...session,
      sessionKeyVerified: true,
    };

    const token = await signSessionToken(updatedPayload);
    const refreshToken = await signRefreshToken(updatedPayload);

    return {
      success: true,
      token,
      refreshToken,
      merchantId: merchant.id,
      merchantName: merchant.name,
      apiKeyMask: merchant.apiKeyMask,
      tier: merchant.tier,
    };
  }
}
