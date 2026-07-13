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
  ],
})
export class AppModule {}
