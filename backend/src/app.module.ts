import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { OrderModule } from './modules/order/order.module';
import { ClaimModule } from './modules/claim/claim.module';
import { FraudModule } from './modules/fraud/fraud.module';
import { PincodeModule } from './modules/pincode/pincode.module';
import { CustomerModule } from './modules/customer/customer.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SandboxModule } from './modules/sandbox/sandbox.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './modules/auth/roles.guard';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MerchantModule,
    OrderModule,
    ClaimModule,
    FraudModule,
    PincodeModule,
    CustomerModule,
    AnalyticsModule,
    SandboxModule,
    DashboardModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 1 minute window
      limit: 5,    // max 5 requests per window
    }]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,  // B-14: enforce rate limits globally
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,      // B-13: enforce roles globally
    },
  ],
})
export class AppModule {}
