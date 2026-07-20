import { Blacklist, Order } from "@prisma/client";

type LegacyOrder = Omit<Order, 'phone'|'pincode'|'riskScore'|'statusReason'|'fulfillmentStatus'> & {
  phone: string;
  pincode: string;
  riskScore: number;
  statusReason: string;
  fulfillmentStatus: string;
};

function toLegacy(o: Order): LegacyOrder {
  return {
    ...o,
    phone: o.phone ?? "",
    pincode: o.pincode ?? "",
    riskScore: o.riskScore ?? 0,
    statusReason: o.statusReason ?? "",
    fulfillmentStatus: o.fulfillmentStatus ?? "",
  };
}

export type GraphRiskLevel = "Low" | "Medium" | "High";
export type GraphNodeType = "phone" | "pincode" | "session";

export interface TrustGraphNodeData {
  nodeType: GraphNodeType;
  label: string;
  rawValue: string;
  riskLevel: GraphRiskLevel;
  fraudSignalCount: number;
  orderCount: number;
  customerName?: string;
  trustScore?: number;
  trustLabel?: string;
  /** Honest disclosure for session-cluster proxy nodes */
  nodeSubtitle?: string;
  sessionOrderCount?: number;
}

export interface TrustGraphNode {
  id: string;
  type: GraphNodeType;
  data: TrustGraphNodeData;
}

export interface TrustGraphEdge {
  id: string;
  source: string;
  target: string;
  data: {
    sharedOrderCount: number;
    hasFraud: boolean;
    edgeKind?: "identifier" | "fraud-cluster";
  };
}

export interface TrustGraphResult {
  nodes: TrustGraphNode[];
  edges: TrustGraphEdge[];
  isEmpty: boolean;
  orderCount: number;
}

const FRAUD_CLUSTER_RE = /\[cluster:([^\]]+)\]/i;

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Per-customer pincode node — never shared across phones. */
function derivePincodeNodeId(phone: string, pincode: string): string {
  return `pincode:${phone}:${pincode}`;
}

/**
 * Checkout-session proxy scoped to a single phone.
 * Same merchant + phone + 15-minute window — not device fingerprinting.
 */
function deriveSessionClusterId(order: LegacyOrder): string {
  const d = order.createdAt;
  const minuteBucket = Math.floor(d.getUTCMinutes() / 15);
  const windowKey = `${d.toISOString().slice(0, 13)}:${minuteBucket}`;
  return `session-${hashStr(`${order.merchantId}:${order.phone}:${windowKey}`)}`;
}

function deriveSessionNodeId(phone: string, sessionClusterId: string): string {
  return `session:${phone}:${sessionClusterId}`;
}

function extractFraudClusterId(order: LegacyOrder): string | null {
  const match = order.statusReason.match(FRAUD_CLUSTER_RE);
  return match ? match[1].trim() : null;
}

function riskFromSignals(fraudOrders: number, signalCount: number, maxRisk: number): GraphRiskLevel {
  if (fraudOrders > 0 || signalCount >= 2 || maxRisk > 70) return "High";
  if (signalCount >= 1 || maxRisk > 30) return "Medium";
  return "Low";
}

function trustLabel(score: number): "Low" | "Medium" | "High" {
  if (score > 70) return "High";
  if (score > 30) return "Medium";
  return "Low";
}

function buyerTrustScore(orders: LegacyOrder[], blacklist: Blacklist | null): number {
  if (!orders.length) return 50;
  const total = orders.length;
  const delivered = orders.filter((o) => o.fulfillmentStatus === "Delivered").length;
  const rto = orders.filter((o) => o.fulfillmentStatus === "RTO").length;
  const fraudFlagged = orders.filter((o) => o.fraudFlagged).length;
  const avgRisk = orders.reduce((sum, o) => sum + o.riskScore, 0) / total;
  const refusalCount = blacklist?.refusalCount ?? 0;
  let score = Math.round(
    85 * (delivered / total) +
      15 * (1 - rto / total) -
      avgRisk * 0.3 -
      fraudFlagged * 12 -
      refusalCount * 8
  );
  return Math.max(0, Math.min(100, score));
}

interface OrderIdentifiers {
  orderId: string;
  phone: string;
  pincodeNodeId: string;
  sessionNodeId: string;
  sessionClusterId: string;
  fraudClusterId: string | null;
  fraudFlagged: boolean;
  riskScore: number;
  pincode: string;
}

function extractIdentifiers(order: LegacyOrder): OrderIdentifiers {
  const sessionClusterId = deriveSessionClusterId(order);
  return {
    orderId: order.id,
    phone: order.phone,
    pincode: order.pincode,
    pincodeNodeId: derivePincodeNodeId(order.phone, order.pincode),
    sessionClusterId,
    sessionNodeId: deriveSessionNodeId(order.phone, sessionClusterId),
    fraudClusterId: extractFraudClusterId(order),
    fraudFlagged: order.fraudFlagged,
    riskScore: order.riskScore,
  };
}

function edgeKey(a: string, b: string): string {
  return a < b ? `${a}--${b}` : `${b}--${a}`;
}

/** Focus expansion: same phone or documented fraud-cluster link only — not shared pincode/session. */
function expandClusterOrders(orders: LegacyOrder[], focusPhone?: string): LegacyOrder[] {
  if (!focusPhone) return orders;

  const seedOrders = orders.filter((o) => o.phone === focusPhone);
  if (!seedOrders.length) return [];

  const clusterIds = new Set<string>();
  for (const order of seedOrders) {
    const clusterId = extractFraudClusterId(order);
    if (clusterId) clusterIds.add(clusterId);
  }

  const phonesInScope = new Set<string>([focusPhone]);
  if (clusterIds.size > 0) {
    for (const order of orders) {
      const clusterId = extractFraudClusterId(order);
      if (clusterId && clusterIds.has(clusterId)) {
        phonesInScope.add(order.phone);
      }
    }
  }

  return orders.filter((o) => phonesInScope.has(o.phone));
}

export function buildTrustGraphFromOrders(
  rawOrders: Order[],
  blacklists: Blacklist[],
  focusPhone?: string
): TrustGraphResult {
  const orders = rawOrders.map(toLegacy);
  const scopedOrders = expandClusterOrders(orders, focusPhone);
  if (!scopedOrders.length) {
    return { nodes: [], edges: [], isEmpty: true, orderCount: 0 };
  }

  const blacklistMap = new Map(blacklists.map((b) => [b.phone, b]));
  const edgeMap = new Map<
    string,
    {
      source: string;
      target: string;
      orderIds: Set<string>;
      hasFraud: boolean;
      edgeKind?: "identifier" | "fraud-cluster";
    }
  >();

  type NodeAcc = {
    type: GraphNodeType;
    label: string;
    rawValue: string;
    orderIds: Set<string>;
    fraudOrders: number;
    maxRisk: number;
    extraSignals: number;
    phone?: string;
  };

  const nodeMap = new Map<string, NodeAcc>();
  const fraudClusterPhones = new Map<string, Set<string>>();

  const ensureNode = (
    id: string,
    type: GraphNodeType,
    label: string,
    rawValue: string,
    phone?: string
  ) => {
    if (!nodeMap.has(id)) {
      nodeMap.set(id, {
        type,
        label,
        rawValue,
        orderIds: new Set(),
        fraudOrders: 0,
        maxRisk: 0,
        extraSignals: 0,
        phone,
      });
    }
    return nodeMap.get(id)!;
  };

  const link = (
    source: string,
    target: string,
    orderId: string,
    hasFraud: boolean,
    edgeKind: "identifier" | "fraud-cluster" = "identifier"
  ) => {
    const key = edgeKey(source, target);
    const existing = edgeMap.get(key);
    if (existing) {
      existing.orderIds.add(orderId);
      existing.hasFraud = existing.hasFraud || hasFraud;
      if (edgeKind === "fraud-cluster") existing.edgeKind = "fraud-cluster";
    } else {
      edgeMap.set(key, {
        source: source < target ? source : target,
        target: source < target ? target : source,
        orderIds: new Set([orderId]),
        hasFraud,
        edgeKind,
      });
    }
  };

  for (const order of scopedOrders) {
    const ids = extractIdentifiers(order);
    const hasFraud = ids.fraudFlagged || ids.riskScore > 70;

    const phoneId = `phone:${ids.phone}`;

    const phoneNode = ensureNode(
      phoneId,
      "phone",
      `Customer • ${ids.phone.slice(-4)}`,
      ids.phone,
      ids.phone
    );
    const pincodeNode = ensureNode(
      ids.pincodeNodeId,
      "pincode",
      `Pincode ${ids.pincode}`,
      ids.pincode,
      ids.phone
    );
    const sessionNode = ensureNode(
      ids.sessionNodeId,
      "session",
      "Session cluster",
      ids.sessionClusterId,
      ids.phone
    );

    for (const node of [phoneNode, pincodeNode, sessionNode]) {
      node.orderIds.add(ids.orderId);
      if (ids.fraudFlagged) node.fraudOrders += 1;
      node.maxRisk = Math.max(node.maxRisk, ids.riskScore);
    }

    const bl = blacklistMap.get(ids.phone);
    if (bl) {
      phoneNode.extraSignals += bl.refusalCount;
    }

    if (ids.fraudClusterId) {
      const phones = fraudClusterPhones.get(ids.fraudClusterId) ?? new Set<string>();
      phones.add(ids.phone);
      fraudClusterPhones.set(ids.fraudClusterId, phones);
    }

    link(phoneId, ids.pincodeNodeId, ids.orderId, hasFraud);
    link(phoneId, ids.sessionNodeId, ids.orderId, hasFraud);
  }

  for (const phones of fraudClusterPhones.values()) {
    const phoneList = [...phones];
    if (phoneList.length < 2) continue;
    for (let i = 0; i < phoneList.length; i++) {
      for (let j = i + 1; j < phoneList.length; j++) {
        link(`phone:${phoneList[i]}`, `phone:${phoneList[j]}`, "cluster", true, "fraud-cluster");
      }
    }
  }

  const nodes: TrustGraphNode[] = Array.from(nodeMap.entries()).map(([id, acc]) => {
    const fraudSignalCount = acc.fraudOrders + (acc.extraSignals > 0 ? 1 : 0);
    const data: TrustGraphNodeData = {
      nodeType: acc.type,
      label: acc.label,
      rawValue: acc.rawValue,
      riskLevel: riskFromSignals(acc.fraudOrders, fraudSignalCount, acc.maxRisk),
      fraudSignalCount,
      orderCount: acc.orderIds.size,
    };

    if (acc.type === "phone" && acc.phone) {
      const phoneOrders = scopedOrders.filter((o) => o.phone === acc.phone);
      const score = buyerTrustScore(phoneOrders, blacklistMap.get(acc.phone) ?? null);
      data.customerName = `Customer • ${acc.phone.slice(-4)}`;
      data.trustScore = score;
      data.trustLabel = trustLabel(score);
    }

    if (acc.type === "pincode") {
      data.nodeSubtitle = "Delivery area for this customer only — not a shared address";
    }

    if (acc.type === "session") {
      data.nodeSubtitle =
        "Orders checked out in the same window — proxy signal, not device fingerprinting";
      data.sessionOrderCount = acc.orderIds.size;
      data.label = `Session · ${acc.orderIds.size} order(s)`;
    }

    return { id, type: acc.type, data };
  });

  const edges: TrustGraphEdge[] = Array.from(edgeMap.entries()).map(([key, edge]) => ({
    id: `edge-${key}`,
    source: edge.source,
    target: edge.target,
    data: {
      sharedOrderCount: edge.orderIds.size,
      hasFraud: edge.hasFraud,
      edgeKind: edge.edgeKind,
    },
  }));

  const hasMultipleNodes = nodes.length > 1;
  const hasConnections = edges.some((e) => e.data.sharedOrderCount > 0);
  const isEmpty = !hasMultipleNodes || !hasConnections;

  return {
    nodes,
    edges,
    isEmpty,
    orderCount: scopedOrders.length,
  };
}
