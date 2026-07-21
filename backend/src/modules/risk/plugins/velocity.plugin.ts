import { Injectable } from "@nestjs/common";
import { RiskPlugin, RiskPluginContext, RiskPluginResult } from "./risk-plugin.interface";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class VelocityPlugin implements RiskPlugin {
  name = "VelocityPlugin";
  weight = 10; // Max contribution of 10 points

  constructor(private readonly prisma: PrismaService) {}

  async calculate(context: RiskPluginContext): Promise<RiskPluginResult> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Count how many orders this phone number placed across ALL merchants in the last 24h
    const orderCount = await this.prisma.order.count({
      where: {
        buyer: { phone: context.phone },
        createdAt: { gte: oneDayAgo },
      },
    });

    const factor = Math.min(1.0, orderCount / 5.0); // capped at 5 orders
    const contribution = factor * this.weight;

    let reason: string | undefined;
    if (orderCount > 2) {
      reason = `High order frequency: ${orderCount} orders in the last 24 hours.`;
    }

    return {
      name: this.name,
      score: Math.round(factor * 100),
      contribution,
      reason,
    };
  }
}
