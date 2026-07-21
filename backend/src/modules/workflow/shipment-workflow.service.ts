import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit.service";
import { randomUUID } from "crypto";
import {
  ShiprocketAdapter,
  DelhiveryAdapter,
  BlueDartAdapter,
  DemoLogisticsAdapter,
} from "../../common/providers/logistics.provider";
import { LogisticsAdapter } from "../../common/providers/provider.interface";

/**
 * ShipmentWorkflowService
 *
 * Manages:
 * - Logistics provider evaluation with ranking
 * - Ranked courier recommendations per order
 * - AI Logistics Confirmation call trigger
 * - Shipment dispatch via selected provider adapter
 *
 * State Machine: COURIER_SELECTED -> DISPATCHED
 */
@Injectable()
export class ShipmentWorkflowService {
  private readonly logger = new Logger(ShipmentWorkflowService.name);

  private readonly adapters: Record<string, LogisticsAdapter> = {
    SHIPROCKET: new ShiprocketAdapter(),
    DELHIVERY: new DelhiveryAdapter(),
    BLUEDART: new BlueDartAdapter(),
    DEMO: new DemoLogisticsAdapter(),
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Generate and persist ranked logistics recommendations for an order.
   */
  async generateRecommendations(orderId: string, correlationId?: string): Promise<void> {
    const corrId = correlationId || randomUUID();

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shippingAddress: true },
    });
    if (!order) return;

    const pincode = order.shippingAddress?.pincode || "000000";

    // Get connected logistics providers for this merchant
    const integrations = await this.prisma.serviceIntegration.findMany({
      where: { merchantId: order.merchantId, type: "LOGISTICS", status: "CONNECTED" },
    });

    // Always include Demo adapter for fallback
    const providersToEvaluate = integrations.length > 0
      ? integrations.map((i) => i.provider.toUpperCase())
      : ["DEMO"];

    const recommendations: Array<{ courier: string; score: number; reason: string }> = [];

    for (const providerKey of providersToEvaluate) {
      const adapter = this.adapters[providerKey] || this.adapters["DEMO"];
      try {
        const stats = await adapter.getCarrierStats(pincode, {});
        const cost = await adapter.calculateRates(order, {});
        const score = Math.round(
          stats.successRate * 50 +
          (1 - stats.rtoRate) * 30 +
          (1 - Math.min(1, cost / 500)) * 20
        );
        const reason = `${Math.round(stats.successRate * 100)}% success rate, ${Math.round(stats.rtoRate * 100)}% RTO, ~₹${cost} shipping`;
        recommendations.push({ courier: providerKey, score, reason });
      } catch (err: any) {
        this.logger.warn(`Failed to evaluate ${providerKey}: ${err.message}`);
      }
    }

    // Sort by score descending and persist with rank
    recommendations.sort((a, b) => b.score - a.score);

    // Delete old recommendations
    await this.prisma.logisticsRecommendation.deleteMany({ where: { orderId } });

    for (let i = 0; i < recommendations.length; i++) {
      await this.prisma.logisticsRecommendation.create({
        data: {
          orderId,
          courier: recommendations[i].courier,
          score: recommendations[i].score,
          rank: i + 1,
          reason: recommendations[i].reason,
        },
      });
    }

    await this.prisma.orderEvent.create({
      data: {
        orderId,
        eventName: "CourierRecommendedEvent",
        description: `Top recommendation: ${recommendations[0]?.courier || "DEMO"} (score: ${recommendations[0]?.score || 0})`,
      },
    });

    await this.auditLog.log({
      merchantId: order.merchantId,
      correlationId: corrId,
      action: "COURIER_RECOMMENDATIONS_GENERATED",
      details: JSON.stringify(recommendations),
      entityType: "ORDER",
      entityId: orderId,
      source: "SHIPMENT_WORKFLOW",
    });
  }

  /**
   * Dispatch shipment using the top-ranked or merchant-selected courier.
   */
  async dispatchShipment(orderId: string, courierId?: string, correlationId?: string): Promise<any> {
    const corrId = correlationId || randomUUID();

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shippingAddress: true, shipment: true },
    });
    if (!order) throw new Error("Order not found");
    if (order.shipment) return order.shipment; // Already dispatched — idempotent

    // Resolve courier
    let selectedCourier = courierId?.toUpperCase() || "DEMO";
    if (!selectedCourier || selectedCourier === "DEMO") {
      const topRec = await this.prisma.logisticsRecommendation.findFirst({
        where: { orderId, rank: 1 },
      });
      selectedCourier = topRec?.courier || "DEMO";
    }

    const adapter = this.adapters[selectedCourier] || this.adapters["DEMO"];
    const shipmentData = await adapter.createShipment(order, {});

    const shipment = await this.prisma.shipment.create({
      data: {
        orderId,
        courier: selectedCourier,
        trackingId: shipmentData.trackingId,
        labelUrl: shipmentData.labelUrl,
        status: "DISPATCHED",
        trackingUpdates: [{ status: "Dispatched", timestamp: new Date().toISOString() }],
      },
    });

    // Update order stage
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        currentStage: "COMPLETED",
        overallStatus: "PROTECTED",
        fulfillmentStatus: "Shipped",
      },
    });

    await this.prisma.orderEvent.create({
      data: {
        orderId,
        eventName: "ShipmentDispatchedEvent",
        description: `Shipment created via ${selectedCourier} | Tracking: ${shipmentData.trackingId}`,
      },
    });

    await this.auditLog.log({
      merchantId: order.merchantId,
      correlationId: corrId,
      action: "SHIPMENT_DISPATCHED",
      details: JSON.stringify({ courier: selectedCourier, trackingId: shipmentData.trackingId }),
      entityType: "ORDER",
      entityId: orderId,
      source: "SHIPMENT_WORKFLOW",
    });

    return shipment;
  }
}
