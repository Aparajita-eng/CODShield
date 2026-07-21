import { Injectable, OnModuleInit } from '@nestjs/common';
import { RiskPluginRegistry } from './risk-plugin.registry';
import { PincodePlugin } from './plugins/pincode.plugin';
import { FraudPlugin } from './plugins/fraud.plugin';
import { BuyerPlugin } from './plugins/buyer.plugin';
import { VelocityPlugin } from './plugins/velocity.plugin';
import { DevicePlugin } from './plugins/device.plugin';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RiskEngineService implements OnModuleInit {
  constructor(
    private readonly registry: RiskPluginRegistry,
    private readonly pincodePlugin: PincodePlugin,
    private readonly fraudPlugin: FraudPlugin,
    private readonly buyerPlugin: BuyerPlugin,
    private readonly velocityPlugin: VelocityPlugin,
    private readonly devicePlugin: DevicePlugin,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    // Register all default plugins on startup
    this.registry.register(this.pincodePlugin);
    this.registry.register(this.fraudPlugin);
    this.registry.register(this.buyerPlugin);
    this.registry.register(this.velocityPlugin);
    this.registry.register(this.devicePlugin);
  }

  async calculateRisk(
    phone: string,
    pincode: string,
    value: number,
    address?: string,
    email?: string,
    deviceId?: string,
    merchantId?: string,
  ) {
    const reasons: string[] = [];
    const executionResults: any[] = [];

    // Fallback resolving merchantId from database if not passed
    let activeMerchantId = merchantId;
    if (!activeMerchantId) {
      const defaultMerchant = await this.prisma.merchant.findFirst();
      activeMerchantId = defaultMerchant ? defaultMerchant.id : "demo-merchant-id";
    }

    const context = {
      phone,
      pincode,
      value,
      email,
      deviceId,
      merchantId: activeMerchantId,
    };

    let totalScore = 0;

    // Run all registered plugins
    for (const plugin of this.registry.getPlugins()) {
      try {
        const result = await plugin.calculate(context);
        totalScore += result.contribution;
        executionResults.push(result);
        if (result.reason) {
          reasons.push(result.reason);
        }
      } catch (err: any) {
        // Plugin failure must not crash the entire pipeline (plugin architecture requirement)
        console.error(`Risk plugin ${plugin.name} failed:`, err);
        executionResults.push({
          name: plugin.name,
          score: 0,
          contribution: 0,
          error: err.message,
        });
      }
    }

    const score = Math.max(5, Math.min(98, Math.round(totalScore)));

    let verdict: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let action: "ALLOW_COD" | "OTP_REQUIRED" | "PREPAID_ONLY" | "REJECT_ORDER" = "ALLOW_COD";

    if (score < 30) {
      verdict = "LOW";
      action = "ALLOW_COD";
    } else if (score < 60) {
      verdict = "MEDIUM";
      action = "OTP_REQUIRED";
      reasons.push("Medium risk score triggers mandatory OTP verification to confirm buyer intent.");
    } else if (score < 80) {
      verdict = "HIGH";
      action = "PREPAID_ONLY";
      reasons.push("High risk score indicates high likelihood of RTO. Restrict to prepaid payments.");
    } else {
      verdict = "CRITICAL";
      action = "REJECT_ORDER";
      reasons.push("Critical risk assessment. Automated rejection to prevent inventory and shipping loss.");
    }

    // Extract individual scores for response compatibility
    const pincodeRes = executionResults.find(r => r.name === "PincodePlugin");
    const fraudRes = executionResults.find(r => r.name === "FraudPlugin");
    const buyerRes = executionResults.find(r => r.name === "BuyerPlugin");

    return {
      score,
      verdict,
      action,
      reasons,
      pincodeRisk: pincodeRes ? Math.round(pincodeRes.contribution) : 0,
      phoneRisk: fraudRes ? Math.round(fraudRes.contribution) : 0,
      valueRisk: buyerRes ? Math.round(buyerRes.contribution) : 0,
      plugins: executionResults,
    };
  }
}
