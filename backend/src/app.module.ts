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
import { BookDemoModule } from './modules/book-demo/book-demo.module';
import { RulesModule } from './modules/rules/rules.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { VerificationModule } from './modules/verification/verification.module';
import { WorkerModule } from './modules/worker/worker.module';
import { AuditModule } from './modules/audit/audit.module';
import { ShipmentModule } from './modules/shipment/shipment.module';

import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './modules/auth/auth.guard';
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
    BookDemoModule,
    RulesModule,
    WorkflowModule,
    LogisticsModule,
    VerificationModule,
    WorkerModule,
    AuditModule,
    ShipmentModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 1 minute window
      limit: 100,  // max 100 requests per window to avoid local dev bottlenecks
    }]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,  // Rate limits globally
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,       // Authentication globally; @Public() bypasses
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,      // Role enforcement globally; @Public() bypasses
    },
  ],
})
export class AppModule {}
