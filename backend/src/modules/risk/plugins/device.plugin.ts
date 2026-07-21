import { Injectable } from "@nestjs/common";
import { RiskPlugin, RiskPluginContext, RiskPluginResult } from "./risk-plugin.interface";

@Injectable()
export class DevicePlugin implements RiskPlugin {
  name = "DevicePlugin";
  weight = 10; // Max contribution of 10 points

  async calculate(context: RiskPluginContext): Promise<RiskPluginResult> {
    // Check if deviceId is present
    const hasDevice = !!context.deviceId;
    const factor = hasDevice ? 0.0 : 0.5; // Moderate risk flag for missing device context (e.g. headless checkout)
    const contribution = factor * this.weight;

    let reason: string | undefined;
    if (!hasDevice) {
      reason = "Checkout initiated without standard browser device fingerprints.";
    }

    return {
      name: this.name,
      score: Math.round(factor * 100),
      contribution,
      reason,
    };
  }
}
