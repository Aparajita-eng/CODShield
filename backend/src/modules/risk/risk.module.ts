import { Module } from '@nestjs/common';
import { RiskEngineService } from './risk.service';
import { PincodeStrategy } from './strategies/pincode.strategy';
import { PhoneStrategy } from './strategies/phone.strategy';
import { ValueStrategy } from './strategies/value.strategy';
import { TrustGraphService } from './graph.service';

@Module({
  providers: [
    RiskEngineService,
    PincodeStrategy,
    PhoneStrategy,
    ValueStrategy,
    TrustGraphService,
  ],
  exports: [RiskEngineService, TrustGraphService],
})
export class RiskModule {}
