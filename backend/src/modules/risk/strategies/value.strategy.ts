import { Injectable } from '@nestjs/common';
import { RiskStrategy } from './risk-strategy.interface';

@Injectable()
export class ValueStrategy implements RiskStrategy {
  async calculate(input: { value: number }) {
    const valueRiskFactor = Math.min(1.0, input.value / 15000.0);

    let reason: string | null = null;
    if (input.value > 8000) {
      reason = "High order value increases financial exposure risk";
    } else if (input.value < 1500) {
      reason = "Low order value reduces financial impact of possible RTO";
    }

    const contribution = valueRiskFactor * 30.0;
    return { contribution, reason };
  }
}
