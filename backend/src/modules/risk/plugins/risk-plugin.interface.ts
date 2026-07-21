export interface RiskPluginContext {
  phone: string;
  pincode: string;
  value: number;
  email?: string;
  deviceId?: string;
  merchantId: string;
}

export interface RiskPluginResult {
  name: string;
  score: number;       // 0 to 100
  contribution: number; // weight-adjusted contribution (e.g. 0 to 30)
  reason?: string;
}

export interface RiskPlugin {
  name: string;
  weight: number; // contribution multiplier (e.g. W1, W2, etc.)
  calculate(context: RiskPluginContext): Promise<RiskPluginResult>;
}
