import { Injectable } from '@nestjs/common';
import { RiskStrategy } from './risk-strategy.interface';
import { fetchPincodeRisk } from '../../../lib/dataAccess';

@Injectable()
export class PincodeStrategy implements RiskStrategy {
  async calculate(input: { pincode: string }) {
    const pinRecord = await fetchPincodeRisk(input.pincode);
    const pincodeRiskWeight = pinRecord ? pinRecord.riskWeight : 0.25;

    let reason: string | null = null;
    if (pinRecord) {
      if (pincodeRiskWeight > 0.6) {
        reason = "Delivery pincode is flagged as a high RTO zone";
      } else if (pincodeRiskWeight < 0.2) {
        reason = "Delivery pincode is a verified low RTO zone";
      }
    } else {
      reason = "Pincode is unrated, applied baseline regional weight";
    }

    const contribution = pincodeRiskWeight * 40.0;
    return { contribution, reason };
  }
}
