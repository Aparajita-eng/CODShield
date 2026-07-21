import { Injectable } from "@nestjs/common";
import { RiskPlugin, RiskPluginContext, RiskPluginResult } from "./risk-plugin.interface";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BuyerPlugin implements RiskPlugin {
  name = "BuyerPlugin";
  weight = 20; // Max contribution of 20 points

  constructor(private readonly prisma: PrismaService) {}

  async calculate(context: RiskPluginContext): Promise<RiskPluginResult> {
    const buyer = await this.prisma.buyer.findUnique({
      where: { phone: context.phone },
    });

    const score = buyer ? buyer.trustScore : 80; // Default high trust for new buyer
    const riskFactor = (100 - score) / 100.0;
    const contribution = riskFactor * this.weight;

    let reason: string | undefined;
    if (buyer) {
      reason = `Buyer trust score is rated at ${buyer.trustScore}/100.`;
    } else {
      reason = "First-time buyer, applied average regional trust score.";
    }

    return {
      name: this.name,
      score: Math.round(riskFactor * 100),
      contribution,
      reason,
    };
  }
}
