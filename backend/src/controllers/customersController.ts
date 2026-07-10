import { Request, Response } from "express";
import { Blacklist, Order } from "@prisma/client";
import { prisma } from "../lib/db";

type TrustLabel = "Low" | "Medium" | "High";
type Severity = "Low" | "Medium" | "High";

/**
 * Normalize phone input to a 10-digit Indian mobile when possible.
 *
 * Inline test cases:
 *   normalizePhone("9876543210")      -> "9876543210"
 *   normalizePhone("+91 9876543210")  -> "9876543210"
 *   normalizePhone("919876543210")    -> "9876543210"
 *   normalizePhone("09876543210")     -> "9876543210"
 *   normalizePhone("9876")            -> "9876"  (partial search preserved)
 */
function isValidIndianMobile(digits: string): boolean {
  return /^[6-9]\d{9}$/.test(digits);
}

function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91") && isValidIndianMobile(digits.slice(2))) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0") && isValidIndianMobile(digits.slice(1))) {
    digits = digits.slice(1);
  }

  return digits;
}

function displayName(phone: string): string {
  return `Customer • ${phone.slice(-4)}`;
}

function trustLabel(score: number): TrustLabel {
  // Mirrors Orders risk bands (≤30 / 31–70 / >70) with inverted semantics:
  // high trust score = good buyer, same numeric cutoffs as getRiskLevelFromScore.
  if (score > 70) return "High";
  if (score > 30) return "Medium";
  return "Low";
}

function calculateBuyerTrustScore(orders: Order[], blacklist: Blacklist | null) {
  if (!orders.length) {
    return { score: 50, label: "Medium" as TrustLabel };
  }

  const total = orders.length;
  const delivered = orders.filter((o) => o.fulfillmentStatus === "Delivered").length;
  const rto = orders.filter((o) => o.fulfillmentStatus === "RTO").length;
  const fraudFlagged = orders.filter((o) => o.fraudFlagged).length;
  const avgRisk = orders.reduce((sum, o) => sum + o.riskScore, 0) / total;
  const refusalCount = blacklist?.refusalCount ?? 0;

  const deliveryRate = delivered / total;
  const rtoRate = rto / total;

  let score = Math.round(
    85 * deliveryRate +
      15 * (1 - rtoRate) -
      avgRisk * 0.3 -
      fraudFlagged * 12 -
      refusalCount * 8
  );
  score = Math.max(0, Math.min(100, score));

  return { score, label: trustLabel(score) };
}

function severityFromScore(score: number): Severity {
  if (score <= 30) return "Low";
  if (score <= 70) return "Medium";
  return "High";
}

function summarizeCustomer(phone: string, orders: Order[], blacklist: Blacklist | null) {
  const { score, label } = calculateBuyerTrustScore(orders, blacklist);
  const lastOrder = orders.reduce((latest, order) =>
    order.createdAt > latest.createdAt ? order : latest
  );

  return {
    phone,
    displayName: displayName(phone),
    orderCount: orders.length,
    lastOrderDate: lastOrder.createdAt.toISOString(),
    trustScore: score,
    trustLabel: label,
  };
}

function buildFraudFlags(orders: Order[], blacklist: Blacklist | null) {
  const flags: {
    id: string;
    type: string;
    date: string;
    severity: Severity;
    orderId?: string;
  }[] = [];

  if (blacklist) {
    flags.push({
      id: `bl-${blacklist.phone}`,
      type: blacklist.reason,
      date: blacklist.createdAt.toISOString(),
      severity: blacklist.refusalCount >= 3 ? "High" : "Medium",
    });
  }

  const rtoOrders = orders
    .filter((o) => o.fulfillmentStatus === "RTO")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  if (rtoOrders.length >= 2) {
    const windowStart = rtoOrders[0].createdAt;
    const windowEnd = rtoOrders[rtoOrders.length - 1].createdAt;
    const days = Math.max(
      1,
      Math.round((windowEnd.getTime() - windowStart.getTime()) / (1000 * 60 * 60 * 24))
    );
    if (days <= 60) {
      flags.push({
        id: `rto-window-${rtoOrders[0].phone}`,
        type: "Multiple RTOs in short window",
        date: windowEnd.toISOString(),
        severity: "High",
      });
    }
  }

  const heldOrders = orders.filter((o) => o.protectionStatus === "Held");
  if (heldOrders.length >= 2) {
    flags.push({
      id: `otp-fail-${heldOrders[0].phone}`,
      type: "OTP failure pattern",
      date: heldOrders[heldOrders.length - 1].createdAt.toISOString(),
      severity: "Medium",
    });
  }

  for (const order of orders.filter((o) => o.fraudFlagged)) {
    flags.push({
      id: `fraud-${order.id}`,
      type: order.statusReason || "Order flagged as fraud",
      date: order.createdAt.toISOString(),
      severity: severityFromScore(order.riskScore),
      orderId: order.id,
    });
  }

  const uniquePincodes = new Set(orders.map((o) => o.pincode));
  const rtoCount = orders.filter((o) => o.fulfillmentStatus === "RTO").length;
  const avgRisk = orders.reduce((sum, o) => sum + o.riskScore, 0) / orders.length;
  if (uniquePincodes.size >= 3 && orders.length >= 3 && (rtoCount >= 1 || avgRisk > 50)) {
    flags.push({
      id: `addr-${orders[0].phone}`,
      type: "Address mismatch across orders",
      date: orders[orders.length - 1].createdAt.toISOString(),
      severity: "Medium",
    });
  }

  return flags.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function buildCustomerTimeline(
  orders: Order[],
  blacklist: Blacklist | null,
  trustScore: number
) {
  const events: {
    id: string;
    timestamp: string;
    title: string;
    description: string;
  }[] = [];

  const sortedOrders = [...orders].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  for (const order of sortedOrders) {
    events.push({
      id: `placed-${order.id}`,
      timestamp: order.createdAt.toISOString(),
      title: "Order placed",
      description: `Order ${order.id} · ₹${Math.round(order.value)} COD`,
    });

    if (order.protectionStatus === "Held") {
      events.push({
        id: `otp-${order.id}`,
        timestamp: new Date(order.createdAt.getTime() + 3600000).toISOString(),
        title: "OTP verification pending",
        description: `Order ${order.id} requires buyer confirmation`,
      });
    } else if (order.protectionStatus === "Protected") {
      events.push({
        id: `verified-${order.id}`,
        timestamp: new Date(order.createdAt.getTime() + 3600000).toISOString(),
        title: "OTP verified",
        description: `Order ${order.id} identity confirmed`,
      });
    }

    if (order.fulfillmentStatus === "Delivered") {
      events.push({
        id: `delivered-${order.id}`,
        timestamp: new Date(order.createdAt.getTime() + 86400000 * 3).toISOString(),
        title: "Delivered",
        description: `Order ${order.id} delivered successfully`,
      });
    }

    if (order.fulfillmentStatus === "RTO") {
      events.push({
        id: `rto-${order.id}`,
        timestamp: new Date(order.createdAt.getTime() + 86400000 * 5).toISOString(),
        title: "RTO",
        description: `Order ${order.id} returned to origin`,
      });
    }

    if (order.fulfillmentStatus === "Cancelled") {
      events.push({
        id: `cancelled-${order.id}`,
        timestamp: new Date(order.createdAt.getTime() + 86400000).toISOString(),
        title: "Cancelled",
        description: order.fraudFlagged
          ? `Order ${order.id} cancelled after fraud review`
          : `Order ${order.id} cancelled`,
      });
    }

    if (order.fraudFlagged) {
      events.push({
        id: `fraud-flag-${order.id}`,
        timestamp: new Date(order.createdAt.getTime() + 7200000).toISOString(),
        title: "Fraud flag raised",
        description: order.statusReason || `Order ${order.id} flagged for review`,
      });
    }
  }

  if (blacklist) {
    events.push({
      id: `blacklist-${blacklist.phone}`,
      timestamp: blacklist.createdAt.toISOString(),
      title: "Added to refusal watchlist",
      description: blacklist.reason,
    });
  }

  if (sortedOrders.length) {
    events.push({
      id: `trust-current-${sortedOrders[0].phone}`,
      timestamp: sortedOrders[sortedOrders.length - 1].createdAt.toISOString(),
      title: "Trust score updated",
      description: `Current buyer trust score: ${trustScore}/100`,
    });
  }

  return events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

function buildDeliveryBreakdown(orders: Order[]) {
  const counts = {
    Delivered: 0,
    RTO: 0,
    Cancelled: 0,
    Pending: 0,
  };

  for (const order of orders) {
    if (order.fulfillmentStatus === "Delivered") counts.Delivered += 1;
    else if (order.fulfillmentStatus === "RTO") counts.RTO += 1;
    else if (order.fulfillmentStatus === "Cancelled") counts.Cancelled += 1;
    else counts.Pending += 1;
  }

  return [
    { name: "Delivered", value: counts.Delivered },
    { name: "RTO", value: counts.RTO },
    { name: "Cancelled", value: counts.Cancelled },
    { name: "Pending", value: counts.Pending },
  ].filter((item) => item.value > 0);
}

function buildMonthlyTrend(orders: Order[]) {
  if (!orders.length) return [];

  const earliest = orders.reduce(
    (min, order) => (order.createdAt < min ? order.createdAt : min),
    orders[0].createdAt
  );

  const cursor = new Date(earliest);
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setDate(1);
  end.setHours(0, 0, 0, 0);

  const months: { month: string; orders: number; rtoRate: number }[] = [];

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    const monthOrders = orders.filter((order) => {
      const created = order.createdAt;
      return created.getFullYear() === year && created.getMonth() === month;
    });

    const rtoCount = monthOrders.filter((o) => o.fulfillmentStatus === "RTO").length;
    const rtoRate =
      monthOrders.length > 0 ? Math.round((rtoCount / monthOrders.length) * 100) : 0;

    months.push({
      month: cursor.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      orders: monthOrders.length,
      rtoRate,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

async function groupOrdersByPhone(phoneFilter?: string) {
  const normalizedFilter = phoneFilter ? normalizePhone(phoneFilter) : undefined;
  const where = normalizedFilter
    ? { phone: { contains: normalizedFilter } }
    : undefined;

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const grouped = new Map<string, Order[]>();
  for (const order of orders) {
    const existing = grouped.get(order.phone) ?? [];
    existing.push(order);
    grouped.set(order.phone, existing);
  }

  return grouped;
}

export async function listCustomers(req: Request, res: Response): Promise<any> {
  try {
    const grouped = await groupOrdersByPhone();
    const phones = Array.from(grouped.keys());

    const blacklists = await prisma.blacklist.findMany({
      where: { phone: { in: phones } },
    });
    const blacklistMap = new Map(blacklists.map((b) => [b.phone, b]));

    const customers = phones
      .map((phone) =>
        summarizeCustomer(phone, grouped.get(phone)!, blacklistMap.get(phone) ?? null)
      )
      .sort((a, b) => {
        if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
        return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
      })
      .slice(0, 12);

    return res.json({ success: true, customers });
  } catch (error) {
    console.error("List customers error:", error);
    return res.status(500).json({ success: false, message: "Failed to load customers" });
  }
}

export async function searchCustomers(req: Request, res: Response): Promise<any> {
  try {
    const query = normalizePhone((req.query.q as string) || "");
    if (!query) {
      return res.json({ success: true, customers: [] });
    }

    const grouped = await groupOrdersByPhone(query);
    const phones = Array.from(grouped.keys()).filter((phone) =>
      normalizePhone(phone).includes(query)
    );

    const blacklists = await prisma.blacklist.findMany({
      where: { phone: { in: phones } },
    });
    const blacklistMap = new Map(blacklists.map((b) => [b.phone, b]));

    const customers = phones
      .map((phone) =>
        summarizeCustomer(phone, grouped.get(phone)!, blacklistMap.get(phone) ?? null)
      )
      .sort((a, b) => b.orderCount - a.orderCount);

    return res.json({ success: true, customers });
  } catch (error) {
    console.error("Search customers error:", error);
    return res.status(500).json({ success: false, message: "Failed to search customers" });
  }
}

export async function getCustomerProfile(req: Request, res: Response): Promise<any> {
  try {
    const phoneParam = (req.query.phone as string) || req.params.phone || "";
    const normalized = normalizePhone(phoneParam);

    if (!normalized) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    const orders = await prisma.order.findMany({
      where: { phone: { contains: normalized } },
      orderBy: { createdAt: "desc" },
    });

    const exactOrders = orders.filter((o) => normalizePhone(o.phone) === normalized);

    if (!exactOrders.length) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const phone = exactOrders[0].phone;
    const blacklist = await prisma.blacklist.findUnique({ where: { phone } });
    const { score, label } = calculateBuyerTrustScore(exactOrders, blacklist);

    const delivered = exactOrders.filter((o) => o.fulfillmentStatus === "Delivered").length;
    const rto = exactOrders.filter((o) => o.fulfillmentStatus === "RTO").length;
    const total = exactOrders.length;
    const fraudFlags = buildFraudFlags(exactOrders, blacklist);

    return res.json({
      success: true,
      profile: {
        phone,
        name: displayName(phone),
        email: `customer.${phone.slice(-4)}@example.com`,
        trustScore: score,
        trustLabel: label,
        stats: {
          pastOrders: total,
          successfulDeliveries: delivered,
          successfulDeliveryPct: total ? Math.round((delivered / total) * 100) : 0,
          rtoCount: rto,
          rtoPct: total ? Math.round((rto / total) * 100) : 0,
          fraudFlags: fraudFlags.length,
        },
        deliveryBreakdown: buildDeliveryBreakdown(exactOrders),
        monthlyTrend: buildMonthlyTrend(exactOrders),
        timeline: buildCustomerTimeline(exactOrders, blacklist, score),
        fraudFlags,
        pastOrders: exactOrders.map((order) => ({
          id: order.id,
          date: order.createdAt.toISOString(),
          value: order.value,
          status: order.fulfillmentStatus,
        })),
      },
    });
  } catch (error) {
    console.error("Get customer profile error:", error);
    return res.status(500).json({ success: false, message: "Failed to load customer profile" });
  }
}
