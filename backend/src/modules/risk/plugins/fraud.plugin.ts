import { Injectable } from "@nestjs/common";
import { RiskPlugin, RiskPluginContext, RiskPluginResult } from "./risk-plugin.interface";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class FraudPlugin implements RiskPlugin {
  name = "FraudPlugin";
  weight = 30; // Max contribution of 30 points

  constructor(private readonly prisma: PrismaService) {}

  async calculate(context: RiskPluginContext): Promise<RiskPluginResult> {
    const record = await this.prisma.blacklist.findUnique({
      where: { phone: context.phone },
    });

    const refusalCount = record ? record.refusalCount : 0;
    const factor = Math.min(1.0, refusalCount / 3.0);
    const contribution = factor * this.weight;

    let reason: string | undefined;
    if (refusalCount > 0) {
      reason = `Phone number has a record of ${refusalCount} historical delivery refusals.`;
    } else {
      reason = "No historical fraud or refusal records found for this phone number.";
    }

    return {
      name: this.name,
      score: Math.round(factor * 100),
      contribution,
      reason,
    };
  }
}
