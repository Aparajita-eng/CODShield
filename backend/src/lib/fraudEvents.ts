import { Blacklist, Order } from "@prisma/client";

export type FraudSeverity = "Low" | "Medium" | "High";
export type InvestigationStatus =
  | "Open"
  | "Under Review"
  | "Confirmed"
  | "Resolved"
  | "Monitoring";

export interface LinkedOrderSummary {
  id: string;
  phone: string;
  pincode: string;
  value: number;
  riskScore: number;
  status: string;
  orderDate: string;
}

export interface FraudEvent {
  id: string;
  severity: FraudSeverity;
  timeline: string;
  detectedPattern: string;
  patternCategory: string;
  linkedOrders: LinkedOrderSummary[];
  linkedPhoneCount: number;
  investigationStatus: InvestigationStatus;
  clusterId?: string;
}

const FRAUD_CLUSTER_RE = /\[cluster:([^\]]+)\]/i;

function extractClusterId(order: Order): string | null {
  const match = order.statusReason.match(FRAUD_CLUSTER_RE);
  return match ? match[1].trim() : null;
}

function cleanStatusReason(reason: string): string {
  return reason.replace(FRAUD_CLUSTER_RE, "").trim();
}

function severityFromScore(score: number): FraudSeverity {
  if (score <= 30) return "Low";
  if (score <= 70) return "Medium";
  return "High";
}

function mapOrder(order: Order): LinkedOrderSummary {
  return {
    id: order.id,
    phone: order.phone,
    pincode: order.pincode,
    value: order.value,
    riskScore: order.riskScore,
    status: order.fulfillmentStatus,
    orderDate: order.createdAt.toISOString(),
  };
}

function deriveInvestigationStatus(orders: Order[]): InvestigationStatus {
  if (!orders.length) return "Monitoring";

  const anyFraud = orders.some((o) => o.fraudFlagged);
  const anyFailed = orders.some((o) => o.protectionStatus === "Failed");
  const anyHeld = orders.some((o) => o.protectionStatus === "Held");
  const hasActive = orders.some((o) =>
    ["Pending", "Verified", "Shipped"].includes(o.fulfillmentStatus)
  );
  const allTerminal = orders.every((o) =>
    ["Delivered", "RTO", "Cancelled"].includes(o.fulfillmentStatus)
  );

  if (anyFraud && anyFailed) return "Confirmed";
  if (hasActive && anyFraud) return "Open";
  if (hasActive && (anyHeld || orders.some((o) => o.riskScore > 70))) return "Under Review";
  if (allTerminal && anyFraud) return "Resolved";
  if (anyHeld) return "Under Review";
  return "Monitoring";
}

function clusterLabel(clusterId: string): string {
  return clusterId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function groupOrdersByPhone(orders: Order[]): Map<string, Order[]> {
  const map = new Map<string, Order[]>();
  for (const order of orders) {
    const list = map.get(order.phone) ?? [];
    list.push(order);
    map.set(order.phone, list);
  }
  return map;
}

export function buildFraudEvents(orders: Order[], blacklists: Blacklist[]): FraudEvent[] {
  const events: FraudEvent[] = [];
  const ordersByPhone = groupOrdersByPhone(orders);
  const ordersInCluster = new Set<string>();

  // Documented fraud-cluster links (Trust Graph investigation output)
  const byCluster = new Map<string, Order[]>();
  for (const order of orders) {
    const clusterId = extractClusterId(order);
    if (!clusterId) continue;
    const list = byCluster.get(clusterId) ?? [];
    list.push(order);
    byCluster.set(clusterId, list);
  }

  for (const [clusterId, clusterOrders] of byCluster) {
    const phones = new Set(clusterOrders.map((o) => o.phone));
    if (clusterOrders.length < 2 && phones.size < 2) continue;

    clusterOrders.forEach((o) => ordersInCluster.add(o.id));
    const avgRisk = Math.round(
      clusterOrders.reduce((sum, o) => sum + o.riskScore, 0) / clusterOrders.length
    );
    const severity = clusterOrders.some((o) => o.fraudFlagged)
      ? "High"
      : severityFromScore(avgRisk);

    events.push({
      id: `cluster-${clusterId}`,
      severity,
      timeline: clusterOrders
        .reduce((latest, o) => (o.createdAt > latest.createdAt ? o : latest))
        .createdAt.toISOString(),
      detectedPattern: `Coordinated fraud cluster — ${clusterLabel(clusterId)} (${phones.size} phones, ${clusterOrders.length} orders)`,
      patternCategory: "Fraud cluster",
      linkedOrders: clusterOrders.map(mapOrder).sort((a, b) => b.orderDate.localeCompare(a.orderDate)),
      linkedPhoneCount: phones.size,
      investigationStatus: deriveInvestigationStatus(clusterOrders),
      clusterId,
    });
  }

  // Blacklist monitoring events
  for (const entry of blacklists) {
    const phoneOrders = ordersByPhone.get(entry.phone) ?? [];
    if (!phoneOrders.length) continue;

    const alreadyCovered = phoneOrders.every((o) => ordersInCluster.has(o.id));
    if (alreadyCovered) continue;

    events.push({
      id: `blacklist-${entry.phone}`,
      severity: entry.refusalCount >= 3 ? "High" : "Medium",
      timeline: phoneOrders
        .reduce((latest, o) => (o.createdAt > latest.createdAt ? o : latest))
        .createdAt.toISOString(),
      detectedPattern: `Blacklisted identity — ${entry.reason}`,
      patternCategory: "Blacklist",
      linkedOrders: phoneOrders.map(mapOrder),
      linkedPhoneCount: 1,
      investigationStatus: deriveInvestigationStatus(phoneOrders),
    });
  }

  // Per-phone behavioral patterns
  for (const [phone, phoneOrders] of ordersByPhone) {
    const sorted = [...phoneOrders].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const uncovered = sorted.filter((o) => !ordersInCluster.has(o.id));
    if (!uncovered.length) continue;

    const rtoOrders = uncovered.filter((o) => o.fulfillmentStatus === "RTO");
    if (rtoOrders.length >= 2) {
      const windowEnd = rtoOrders[rtoOrders.length - 1].createdAt;
      const windowStart = rtoOrders[0].createdAt;
      const days = Math.max(
        1,
        Math.round((windowEnd.getTime() - windowStart.getTime()) / (1000 * 60 * 60 * 24))
      );
      if (days <= 90) {
        events.push({
          id: `rto-pattern-${phone}`,
          severity: "High",
          timeline: windowEnd.toISOString(),
          detectedPattern: `Repeat RTO pattern — ${rtoOrders.length} returns within ${days} days`,
          patternCategory: "RTO pattern",
          linkedOrders: rtoOrders.map(mapOrder),
          linkedPhoneCount: 1,
          investigationStatus: deriveInvestigationStatus(rtoOrders),
        });
      }
    }

    const heldOrders = uncovered.filter((o) => o.protectionStatus === "Held");
    if (heldOrders.length >= 2) {
      events.push({
        id: `otp-pattern-${phone}`,
        severity: "Medium",
        timeline: heldOrders[heldOrders.length - 1].createdAt.toISOString(),
        detectedPattern: "OTP verification failure pattern across multiple orders",
        patternCategory: "OTP failure",
        linkedOrders: heldOrders.map(mapOrder),
        linkedPhoneCount: 1,
        investigationStatus: deriveInvestigationStatus(heldOrders),
      });
    }

    const uniquePincodes = new Set(uncovered.map((o) => o.pincode));
    const rtoCount = uncovered.filter((o) => o.fulfillmentStatus === "RTO").length;
    const avgRisk = uncovered.reduce((sum, o) => sum + o.riskScore, 0) / uncovered.length;
    if (uniquePincodes.size >= 3 && uncovered.length >= 3 && (rtoCount >= 1 || avgRisk > 50)) {
      events.push({
        id: `address-pattern-${phone}`,
        severity: "Medium",
        timeline: sorted[sorted.length - 1].createdAt.toISOString(),
        detectedPattern: `Address spread anomaly — ${uniquePincodes.size} pincodes across ${uncovered.length} orders`,
        patternCategory: "Address anomaly",
        linkedOrders: uncovered.map(mapOrder),
        linkedPhoneCount: 1,
        investigationStatus: deriveInvestigationStatus(uncovered),
      });
    }

    for (const order of uncovered.filter((o) => o.fraudFlagged)) {
      events.push({
        id: `fraud-order-${order.id}`,
        severity: severityFromScore(order.riskScore),
        timeline: order.createdAt.toISOString(),
        detectedPattern: cleanStatusReason(order.statusReason) || "Order manually flagged as fraud",
        patternCategory: "Fraud flag",
        linkedOrders: [mapOrder(order)],
        linkedPhoneCount: 1,
        investigationStatus: deriveInvestigationStatus([order]),
      });
    }

    const highRiskHeld = uncovered.filter(
      (o) => !o.fraudFlagged && o.riskScore > 70 && o.protectionStatus === "Held"
    );
    for (const order of highRiskHeld) {
      events.push({
        id: `high-risk-${order.id}`,
        severity: "High",
        timeline: order.createdAt.toISOString(),
        detectedPattern: cleanStatusReason(order.statusReason) || "High risk score with manual review hold",
        patternCategory: "High risk",
        linkedOrders: [mapOrder(order)],
        linkedPhoneCount: 1,
        investigationStatus: deriveInvestigationStatus([order]),
      });
    }

    const deviceSignal = uncovered.find((o) =>
      /device|session|account/i.test(o.statusReason)
    );
    if (deviceSignal && !deviceSignal.fraudFlagged) {
      events.push({
        id: `device-signal-${phone}`,
        severity: severityFromScore(deviceSignal.riskScore),
        timeline: deviceSignal.createdAt.toISOString(),
        detectedPattern: cleanStatusReason(deviceSignal.statusReason),
        patternCategory: "Session signal",
        linkedOrders: [mapOrder(deviceSignal)],
        linkedPhoneCount: 1,
        investigationStatus: deriveInvestigationStatus([deviceSignal]),
      });
    }
  }

  return events.sort((a, b) => new Date(b.timeline).getTime() - new Date(a.timeline).getTime());
}

export function filterFraudEvents(
  events: FraudEvent[],
  options: {
    severities?: FraudSeverity[];
    statuses?: InvestigationStatus[];
    startDate?: string;
    endDate?: string;
    search?: string;
    patternCategory?: string;
  }
): FraudEvent[] {
  let result = events;

  if (options.severities?.length) {
    const allowed = new Set(options.severities);
    result = result.filter((e) => allowed.has(e.severity));
  }

  if (options.statuses?.length) {
    const allowed = new Set(options.statuses);
    result = result.filter((e) => allowed.has(e.investigationStatus));
  }

  if (options.patternCategory) {
    result = result.filter((e) => e.patternCategory === options.patternCategory);
  }

  if (options.startDate) {
    const start = new Date(options.startDate);
    result = result.filter((e) => new Date(e.timeline) >= start);
  }

  if (options.endDate) {
    const end = new Date(options.endDate);
    end.setHours(23, 59, 59, 999);
    result = result.filter((e) => new Date(e.timeline) <= end);
  }

  if (options.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    result = result.filter(
      (e) =>
        e.detectedPattern.toLowerCase().includes(q) ||
        e.patternCategory.toLowerCase().includes(q) ||
        e.linkedOrders.some(
          (o) => o.id.toLowerCase().includes(q) || o.phone.includes(q) || o.pincode.includes(q)
        )
    );
  }

  return result;
}
