import { LogisticsAdapter, ProviderCapabilities, CourierStats } from "./provider.interface";

export class ShiprocketAdapter implements LogisticsAdapter {
  getCapabilities(): ProviderCapabilities {
    return {
      supportsLabels: true,
      supportsTracking: true,
      supportsReversePickup: true,
      supportsCod: true,
    };
  }

  async validateCredentials(config: any): Promise<boolean> {
    if (!config || !config.token) return false;
    return config.token.startsWith("sr_");
  }

  async calculateRates(order: any, config: any): Promise<number> {
    const val = order.value || 100;
    return Math.max(50, Math.min(250, Math.floor(val * 0.05 + 40)));
  }

  async createShipment(order: any, config: any): Promise<{ trackingId: string; labelUrl: string; status: string }> {
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
    return {
      trackingId: `SR${randomSuffix}`,
      labelUrl: `https://shiprocket.co/labels/SR${randomSuffix}.pdf`,
      status: "PENDING",
    };
  }

  async getTrackingStatus(trackingId: string, config: any): Promise<{ status: string; updates: any[] }> {
    return {
      status: "IN_TRANSIT",
      updates: [
        { status: "Manifested", location: "Bengaluru", timestamp: new Date().toISOString() },
        { status: "In Transit", location: "Mumbai Hub", timestamp: new Date().toISOString() },
      ],
    };
  }

  async getCarrierStats(pincode: string, config: any): Promise<CourierStats> {
    // Generate realistic stats based on pincode digits
    const codeVal = parseInt(pincode || "560001", 10);
    const successRate = codeVal % 2 === 0 ? 0.94 : 0.88;
    const rtoRate = 1 - successRate;
    return {
      successRate,
      rtoRate,
      transitTimeDays: (codeVal % 3) + 2,
      cost: (codeVal % 50) + 70,
    };
  }
}

export class DelhiveryAdapter implements LogisticsAdapter {
  getCapabilities(): ProviderCapabilities {
    return {
      supportsLabels: true,
      supportsTracking: true,
      supportsReversePickup: false,
      supportsCod: true,
    };
  }

  async validateCredentials(config: any): Promise<boolean> {
    if (!config || !config.token) return false;
    return config.token.startsWith("dl_") || config.token.startsWith("delhivery_");
  }

  async calculateRates(order: any, config: any): Promise<number> {
    const val = order.value || 100;
    return Math.max(60, Math.min(300, Math.floor(val * 0.04 + 50)));
  }

  async createShipment(order: any, config: any): Promise<{ trackingId: string; labelUrl: string; status: string }> {
    const randomSuffix = Math.floor(1000000000 + Math.random() * 9000000000);
    return {
      trackingId: `DEL${randomSuffix}`,
      labelUrl: `https://delhivery.com/labels/DEL${randomSuffix}.pdf`,
      status: "PENDING",
    };
  }

  async getTrackingStatus(trackingId: string, config: any): Promise<{ status: string; updates: any[] }> {
    return {
      status: "DISPATCHED",
      updates: [
        { status: "Picked Up", location: "Warehouse Delhi", timestamp: new Date().toISOString() },
      ],
    };
  }

  async getCarrierStats(pincode: string, config: any): Promise<CourierStats> {
    const codeVal = parseInt(pincode || "110001", 10);
    const successRate = codeVal % 3 === 0 ? 0.91 : 0.85;
    return {
      successRate,
      rtoRate: 1 - successRate,
      transitTimeDays: (codeVal % 4) + 1,
      cost: (codeVal % 60) + 65,
    };
  }
}

export class BlueDartAdapter implements LogisticsAdapter {
  getCapabilities(): ProviderCapabilities {
    return {
      supportsLabels: true,
      supportsTracking: true,
      supportsReversePickup: true,
      supportsCod: true,
    };
  }

  async validateCredentials(config: any): Promise<boolean> {
    if (!config || !config.licenseKey) return false;
    return config.licenseKey.length > 5;
  }

  async calculateRates(order: any, config: any): Promise<number> {
    const val = order.value || 100;
    return Math.max(90, Math.min(450, Math.floor(val * 0.06 + 80)));
  }

  async createShipment(order: any, config: any): Promise<{ trackingId: string; labelUrl: string; status: string }> {
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
    return {
      trackingId: `BD${randomSuffix}`,
      labelUrl: `https://bluedart.com/labels/BD${randomSuffix}.pdf`,
      status: "PENDING",
    };
  }

  async getTrackingStatus(trackingId: string, config: any): Promise<{ status: string; updates: any[] }> {
    return {
      status: "DELIVERED",
      updates: [
        { status: "Out for Delivery", location: "Chennai Hub", timestamp: new Date().toISOString() },
        { status: "Delivered", location: "Chennai Hub", timestamp: new Date().toISOString() },
      ],
    };
  }

  async getCarrierStats(pincode: string, config: any): Promise<CourierStats> {
    const codeVal = parseInt(pincode || "600001", 10);
    return {
      successRate: 0.95,
      rtoRate: 0.05,
      transitTimeDays: (codeVal % 2) + 1,
      cost: (codeVal % 40) + 120,
    };
  }
}

export class DemoLogisticsAdapter implements LogisticsAdapter {
  getCapabilities(): ProviderCapabilities {
    return {
      supportsLabels: true,
      supportsTracking: true,
      supportsReversePickup: true,
      supportsCod: true,
    };
  }

  async validateCredentials(config: any): Promise<boolean> {
    return true;
  }

  async calculateRates(order: any, config: any): Promise<number> {
    return 80;
  }

  async createShipment(order: any, config: any): Promise<{ trackingId: string; labelUrl: string; status: string }> {
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
    return {
      trackingId: `DEMO-SHIP-${randomSuffix}`,
      labelUrl: `https://codshield-demo.s3.amazonaws.com/labels/${randomSuffix}.pdf`,
      status: "PENDING",
    };
  }

  async getTrackingStatus(trackingId: string, config: any): Promise<{ status: string; updates: any[] }> {
    return {
      status: "PENDING",
      updates: [
        { status: "Ready for Pickup", location: "Warehouse A", timestamp: new Date().toISOString() },
      ],
    };
  }

  async getCarrierStats(pincode: string, config: any): Promise<CourierStats> {
    return {
      successRate: 0.90,
      rtoRate: 0.10,
      transitTimeDays: 3,
      cost: 80,
    };
  }
}
