export interface ProviderCapabilities {
  supportsLabels: boolean;
  supportsTracking: boolean;
  supportsReversePickup: boolean;
  supportsCod: boolean;
}

export interface CourierStats {
  successRate: number; // 0.0 to 1.0
  rtoRate: number;     // 0.0 to 1.0
  transitTimeDays: number;
  cost: number;
}

export interface LogisticsAdapter {
  getCapabilities(): ProviderCapabilities;
  validateCredentials(config: any): Promise<boolean>;
  calculateRates(order: any, config: any): Promise<number>;
  createShipment(order: any, config: any): Promise<{ trackingId: string; labelUrl: string; status: string }>;
  getTrackingStatus(trackingId: string, config: any): Promise<{ status: string; updates: any[] }>;
  getCarrierStats(pincode: string, config: any): Promise<CourierStats>;
}

export interface WhatsAppAdapter {
  validateCredentials(config: any): Promise<boolean>;
  sendVerificationMessage(phone: string, orderDetails: any, config: any): Promise<{ messageId: string; status: string }>;
  getMessageStatus(messageId: string, config: any): Promise<string>;
}

export interface VoiceAdapter {
  validateCredentials(config: any): Promise<boolean>;
  triggerConfirmationCall(phone: string, callDetails: any, config: any): Promise<{ callId: string; status: string }>;
  getCallStatus(callId: string, config: any): Promise<{ status: string; digitPressed?: string }>;
}
