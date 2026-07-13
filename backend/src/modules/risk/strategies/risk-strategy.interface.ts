export interface RiskStrategy {
  calculate(input: {
    phone: string;
    pincode: string;
    value: number;
    customerHistory?: any;
  }): Promise<{
    contribution: number;
    reason: string | null;
  }>;
}
