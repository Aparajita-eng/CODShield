import { Response } from "express";
import { prisma } from "../lib/db";
import { fetchMerchants, fetchOrders, fetchOrderById, fetchPincodeRisk, bulkUpdateOrdersByIds } from "../lib/dataAccess";
import {
  assertSessionMerchantAccess,
  resolveActiveMerchantId,
} from "../lib/merchantAccess";
import { AuthenticatedRequest } from "../middleware/requireSession";
import { Claim, Order, PincodeRisk } from "@prisma/client";

type OrderStatus = "Pending" | "Verified" | "Shipped" | "Delivered" | "RTO" | "Cancelled";
type RiskLevel = "Low" | "Medium" | "High";

function getRiskLevel(score: number): RiskLevel {
  if (score <= 30) return "Low";
  if (score <= 70) return "Medium";
  return "High";
}

function getRiskDecision(score: number): "Auto-approved" | "Manual review" | "Auto-flagged" {
  if (score <= 30) return "Auto-approved";
  if (score <= 70) return "Manual review";
  return "Auto-flagged";
}

function parseRiskFactors(statusReason: string): string[] {
  return statusReason
    .split(/[.;]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildTimeline(order: Order) {
  const events: { date: string; status: string; description: string }[] = [
    {
      date: order.createdAt.toISOString(),
      status: "Order Placed",
      description: "Order received from customer",
    },
  ];

  if (order.fulfillmentStatus === "Verified" || order.protectionStatus === "Protected") {
    events.push({
      date: order.createdAt.toISOString(),
      status: "Verified",
      description: "OTP verified successfully",
    });
  }

  if (["Shipped", "Delivered", "RTO"].includes(order.fulfillmentStatus)) {
    events.push({
      date: order.createdAt.toISOString(),
      status: "Shipped",
      description: "Dispatched to logistics",
    });
  }

  if (order.fulfillmentStatus === "Delivered") {
    events.push({
      date: order.createdAt.toISOString(),
      status: "Delivered",
      description: "Delivered to customer",
    });
  }

  if (order.fulfillmentStatus === "RTO") {
    events.push({
      date: order.createdAt.toISOString(),
      status: "RTO",
      description: "Returned to origin",
    });
  }

  if (order.fulfillmentStatus === "Cancelled") {
    events.push({
      date: order.createdAt.toISOString(),
      status: "Cancelled",
      description: order.fraudFlagged ? "Order flagged as fraud" : "Order cancelled",
    });
  }

  return events;
}

function mapOrderListItem(order: Order) {
  return {
    id: order.id,
    merchantId: order.merchantId,
    customerName: `Customer • ${order.phone.slice(-4)}`,
    phone: order.phone,
    pincode: order.pincode,
    value: order.value,
    riskScore: order.riskScore,
    status: order.fulfillmentStatus as OrderStatus,
    protectionStatus: order.protectionStatus,
    orderDate: order.createdAt.toISOString(),
    riskFactors: parseRiskFactors(order.statusReason),
    otpVerified: order.protectionStatus !== "Held",
    fraudFlagged: order.fraudFlagged,
    timeline: buildTimeline(order),
  };
}

function pincodeRiskLevel(weight: number): RiskLevel {
  if (weight <= 0.3) return "Low";
  if (weight <= 0.6) return "Medium";
  return "High";
}

function buildOrderDetail(
  order: Order,
  pincodeRisk: PincodeRisk | null,
  claim: Claim | null
) {
  const listItem = mapOrderListItem(order);
  const riskFactors = listItem.riskFactors;
  const factorCount = Math.max(riskFactors.length, 1);
  const weight = 1 / factorCount;

  const pincodeRiskLevelValue = pincodeRisk
    ? pincodeRiskLevel(pincodeRisk.riskWeight)
    : getRiskLevel(order.riskScore);

  const otpHistory =
    order.protectionStatus === "Held"
      ? [
          {
            timestamp: new Date(order.createdAt.getTime() + 3600000).toISOString(),
            channel: "SMS" as const,
            status: "Sent" as const,
            attemptCount: 1,
          },
          {
            timestamp: new Date(order.createdAt.getTime() + 7200000).toISOString(),
            channel: "WhatsApp" as const,
            status: "Expired" as const,
            attemptCount: 2,
          },
        ]
      : [
          {
            timestamp: new Date(order.createdAt.getTime() + 3600000).toISOString(),
            channel: "SMS" as const,
            status: "Sent" as const,
            attemptCount: 1,
          },
          {
            timestamp: new Date(order.createdAt.getTime() + 3900000).toISOString(),
            channel: "WhatsApp" as const,
            status: "Verified" as const,
            attemptCount: 2,
          },
        ];

  const fraudEvents =
    order.fraudFlagged || order.riskScore >= 70
      ? riskFactors.map((factor, index) => ({
          id: `fe-${order.id}-${index}`,
          timestamp: new Date(order.createdAt.getTime() + (index + 1) * 1800000).toISOString(),
          message: factor,
          severity: getRiskLevel(order.riskScore),
        }))
      : [];

  return {
    ...listItem,
    customer: {
      name: listItem.customerName,
      phone: order.phone,
      email: `customer.${order.phone.slice(-4)}@example.com`,
      pastOrderCount: Math.max(1, 20 - order.riskScore),
      pastRtoRate: Math.min(35, Math.round(order.riskScore / 3)),
    },
    address: {
      line1: `Delivery address for pincode ${order.pincode}`,
      city: "India",
      state: "—",
      pincode: order.pincode,
      pincodeRisk: pincodeRiskLevelValue,
    },
    riskBreakdown: riskFactors.map((factor) => ({
      factor,
      weight,
      contribution: Math.round(order.riskScore * weight),
    })),
    otpHistory,
    fraudEvents,
    timeline: listItem.timeline.map((event, index) => ({
      id: `t-${order.id}-${index}`,
      timestamp: new Date(event.date).toISOString(),
      title: event.status,
      description: event.description,
    })),
    claim: claim
      ? {
          id: claim.id,
          status: claim.status as "Pending" | "Open" | "Under Review" | "Resolved" | "Rejected",
          type: "RTO Dispute",
        }
      : undefined,
    riskDecision: getRiskDecision(order.riskScore),
    items: [{ name: "COD Order Items", quantity: 1, price: order.value }],
    paymentMethod: "COD",
  };
}

export async function listOrders(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const scope = await resolveActiveMerchantId(
      req.session!,
      req.query.merchantId as string | undefined
    );
    if (!scope.ok) {
      return res.status(scope.status).json({ success: false, message: scope.message });
    }

    const allMerchants = await fetchMerchants();
    const merchants = allMerchants.filter((m) => scope.allowedIds.includes(m.id));

    const orders = await fetchOrders({
      where: { merchantId: scope.merchantId },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      merchants,
      selectedMerchantId: scope.merchantId,
      orders: orders.map(mapOrderListItem),
    });
  } catch (error) {
    console.error("List orders error:", error);
    return res.status(500).json({ success: false, message: "Failed to load orders" });
  }
}

export async function getOrderById(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { orderId } = req.params;

    const order = await fetchOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const access = await assertSessionMerchantAccess(req.session!, order.merchantId);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const [pincodeRisk, claim] = await Promise.all([
      fetchPincodeRisk(order.pincode),
      prisma.claim.findFirst({ where: { orderId: order.id } }).catch(() => null),
    ]);

    return res.json({
      success: true,
      order: buildOrderDetail(order, pincodeRisk, claim),
    });
  } catch (error) {
    console.error("Get order error:", error);
    return res.status(500).json({ success: false, message: "Failed to load order" });
  }
}

export async function bulkUpdateOrders(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { orderIds, action } = req.body as { orderIds?: string[]; action?: string };

    if (!orderIds?.length || !action) {
      return res.status(400).json({
        success: false,
        message: "orderIds and action are required",
      });
    }

    const scope = await resolveActiveMerchantId(req.session!);
    if (!scope.ok) {
      return res.status(scope.status).json({ success: false, message: scope.message });
    }

    for (const orderId of orderIds) {
      const order = await fetchOrderById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: `Order not found: ${orderId}` });
      }
      const access = await assertSessionMerchantAccess(req.session!, order.merchantId);
      if (!access.ok) {
        return res.status(access.status).json({ success: false, message: access.message });
      }
    }

    if (action !== "verify" && action !== "flag_fraud") {
      return res.status(400).json({ success: false, message: "Unknown bulk action" });
    }

    const orders = await bulkUpdateOrdersByIds(orderIds, action);

    return res.json({
      success: true,
      message: `Updated ${orders.length} order(s)`,
      orders: orders.map(mapOrderListItem),
    });
  } catch (error) {
    console.error("Bulk update orders error:", error);
    return res.status(500).json({ success: false, message: "Failed to update orders" });
  }
}
