import { Module } from '@nestjs/common';
import { RiskEngineService } from './risk.service';
import { RiskPluginRegistry } from './risk-plugin.registry';
import { PincodePlugin } from './plugins/pincode.plugin';
import { FraudPlugin } from './plugins/fraud.plugin';
import { BuyerPlugin } from './plugins/buyer.plugin';
import { VelocityPlugin } from './plugins/velocity.plugin';
import { DevicePlugin } from './plugins/device.plugin';
import { TrustGraphService } from './graph.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    RiskEngineService,
    RiskPluginRegistry,
    PincodePlugin,
    FraudPlugin,
    BuyerPlugin,
    VelocityPlugin,
    DevicePlugin,
    TrustGraphService,
  ],
  exports: [RiskEngineService, TrustGraphService, RiskPluginRegistry],
})
export class RiskModule {}
