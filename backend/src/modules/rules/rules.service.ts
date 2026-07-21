import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RulesEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateRules(order: any, riskAssessment: any, buyer: any): Promise<{ matched: boolean; action?: any; reason?: string }> {
    // 1. Fetch enabled rules for this merchant ordered by priority DESC (highest first)
    const rules = await this.prisma.rule.findMany({
      where: {
        merchantId: order.merchantId,
        enabled: true,
      },
      orderBy: {
        priority: "desc",
      },
    });

    const context = {
      value: order.value,
      paymentMode: order.paymentMode,
      pincode: order.shippingAddress?.pincode || order.pincode,
      riskScore: riskAssessment.score,
      buyerTrustScore: buyer?.trustScore || 80,
      city: order.shippingAddress?.city || "",
      state: order.shippingAddress?.state || "",
    };

    for (const rule of rules) {
      const conditions = rule.conditions as any;
      if (this.evaluateConditions(context, conditions)) {
        return {
          matched: true,
          action: rule.action,
          reason: (rule.action as any)?.reason || "Action triggered by dynamic rule match.",
        };
      }
    }

    return { matched: false };
  }

  private evaluateConditions(context: any, conditions: any): boolean {
    if (!conditions || typeof conditions !== "object" || Object.keys(conditions).length === 0) {
      return false;
    }

    for (const key of Object.keys(conditions)) {
      const condition = conditions[key];
      const contextValue = context[key];

      if (contextValue === undefined) {
        return false;
      }

      if (!this.checkMatch(contextValue, condition)) {
        return false;
      }
    }

    return true;
  }

  private checkMatch(value: any, spec: any): boolean {
    if (spec === null || spec === undefined) return false;
    if (typeof spec !== "object" || Array.isArray(spec)) {
      return value === spec;
    }

    for (const operator of Object.keys(spec)) {
      const specValue = spec[operator];
      switch (operator) {
        case "eq":
          if (value !== specValue) return false;
          break;
        case "ne":
          if (value === specValue) return false;
          break;
        case "gt":
          if (!(value > specValue)) return false;
          break;
        case "gte":
          if (!(value >= specValue)) return false;
          break;
        case "lt":
          if (!(value < specValue)) return false;
          break;
        case "lte":
          if (!(value <= specValue)) return false;
          break;
        case "in":
          if (Array.isArray(specValue) && !specValue.includes(value)) return false;
          break;
        case "contains":
          if (typeof value === "string" && !value.includes(specValue)) return false;
          break;
        default:
          return false;
      }
    }

    return true;
  }
}
