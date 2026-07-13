import { Injectable } from '@nestjs/common';
import { PincodeStrategy } from './strategies/pincode.strategy';
import { PhoneStrategy } from './strategies/phone.strategy';
import { ValueStrategy } from './strategies/value.strategy';

@Injectable()
export class RiskEngineService {
  constructor(
    private readonly pincodeStrategy: PincodeStrategy,
    private readonly phoneStrategy: PhoneStrategy,
    private readonly valueStrategy: ValueStrategy,
  ) {}

  async calculateRisk(
    phone: string,
    pincode: string,
    value: number,
    address?: string,
    customerHistory?: any,
  ) {
    const reasons: string[] = [];

    const pinRes = await this.pincodeStrategy.calculate({ pincode });
    if (pinRes.reason) reasons.push(pinRes.reason);

    const phoneRes = await this.phoneStrategy.calculate({ phone });
    if (phoneRes.reason) reasons.push(phoneRes.reason);

    const valueRes = await this.valueStrategy.calculate({ value });
    if (valueRes.reason) reasons.push(valueRes.reason);

    const score = Math.max(5, Math.min(98, Math.round(pinRes.contribution + phoneRes.contribution + valueRes.contribution)));

    let verdict: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let action: "ALLOW_COD" | "OTP_REQUIRED" | "PREPAID_ONLY" | "REJECT_ORDER" = "ALLOW_COD";

    if (score < 30) {
      verdict = "LOW";
      action = "ALLOW_COD";
    } else if (score < 60) {
      verdict = "MEDIUM";
      action = "OTP_REQUIRED";
      reasons.push("Medium risk score triggers mandatory OTP verification to confirm buyer intent");
    } else if (score < 80) {
      verdict = "HIGH";
      action = "PREPAID_ONLY";
      reasons.push("High risk score indicates high likelihood of RTO. Restrict to prepaid payments");
    } else {
      verdict = "CRITICAL";
      action = "REJECT_ORDER";
      reasons.push("Critical risk assessment. Automated rejection to prevent inventory and shipping loss");
    }

    return {
      score,
      verdict,
      action,
      reasons,
      pincodeRisk: Math.round(pinRes.contribution),
      valueRisk: Math.round(valueRes.contribution),
      phoneRisk: Math.round(phoneRes.contribution),
    };
  }
}
