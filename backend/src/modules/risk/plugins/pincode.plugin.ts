import { Injectable } from "@nestjs/common";
import { RiskPlugin, RiskPluginContext, RiskPluginResult } from "./risk-plugin.interface";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PincodePlugin implements RiskPlugin {
  name = "PincodePlugin";
  weight = 30; // Max contribution of 30 points

  constructor(private readonly prisma: PrismaService) {}

  async calculate(context: RiskPluginContext): Promise<RiskPluginResult> {
    const record = await this.prisma.pincodeRisk.findUnique({
      where: { pincode: context.pincode },
    });

    const riskWeight = record ? record.riskWeight : 0.35; // Default moderate risk if unrated
    const contribution = riskWeight * this.weight;

    let reason: string | undefined;
    if (record) {
      if (riskWeight > 0.6) {
        reason = `Delivery pincode ${context.pincode} is flagged as a high RTO zone.`;
      } else if (riskWeight < 0.2) {
        reason = `Delivery pincode ${context.pincode} is a verified low RTO zone.`;
      }
    } else {
      reason = "Pincode is unrated, baseline weight applied.";
    }

    return {
      name: this.name,
      score: Math.round(riskWeight * 100),
      contribution,
      reason,
    };
  }
}
