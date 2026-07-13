import { Injectable } from '@nestjs/common';
import { RiskStrategy } from './risk-strategy.interface';
import { fetchBlacklistByPhone } from '../../../lib/dataAccess';

@Injectable()
export class PhoneStrategy implements RiskStrategy {
  async calculate(input: { phone: string }) {
    const blacklistRecord = await fetchBlacklistByPhone(input.phone);
    const refusalCount = blacklistRecord ? blacklistRecord.refusalCount : 0;
    const phoneRiskFactor = Math.min(1.0, refusalCount / 3.0);

    let reason: string | null = null;
    if (refusalCount > 0) {
      reason = `Phone number has a record of ${refusalCount} historical delivery refusals`;
    } else {
      reason = "No historical fraud or refusal records found for this phone number";
    }

    const contribution = phoneRiskFactor * 30.0;
    return { contribution, reason };
  }
}
