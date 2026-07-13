import { Module } from '@nestjs/common';
import { FraudService } from './fraud.service';
import { FraudController } from './fraud.controller';
import { AuthModule } from '../auth/auth.module';
import { RiskModule } from '../risk/risk.module';

@Module({
  imports: [AuthModule, RiskModule],
  controllers: [FraudController],
  providers: [FraudService],
  exports: [FraudService],
})
export class FraudModule {}
