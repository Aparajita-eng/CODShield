import { Order } from "@prisma/client";
import { resolvePincodeRegion } from "./pincodeLookup";

export type RiskLevel = "Low" | "Medium" | "High";

export interface PincodeMetrics {
  pincode: string;
  city: string;
  district: string;
  state: string;
  orderCount: number;
  riskScore: number;
  riskLevel: RiskLevel;
  successPct: number;
  fraudPct: number;
}

export interface StateAggregate {
  state: string;
  orderCount: number;
  pincodeCount: number;
  avgRiskScore: number;
  riskLevel: RiskLevel;
  successPct: number;
  fraudPct: number;
}

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 30) return "Low";
  if (score <= 70) return "Medium";
  return "High";
}

function isFraudOrRto(order: Order): boolean {
  return order.fraudFlagged || order.fulfillmentStatus === "RTO";
}

function isSuccessful(order: Order): boolean {
  return order.fulfillmentStatus === "Delivered";
}

export function buildPincodeMetrics(orders: Order[]): PincodeMetrics[] {
  const groups = new Map<string, Order[]>();

  for (const order of orders) {
    const list = groups.get(order.pincode) ?? [];
    list.push(order);
    groups.set(order.pincode, list);
  }

  return Array.from(groups.entries()).map(([pincode, pinOrders]) => {
    const region = resolvePincodeRegion(pincode);
    const orderCount = pinOrders.length;
    const riskScore = Math.round(
      pinOrders.reduce((sum, o) => sum + o.riskScore, 0) / orderCount
    );
    const delivered = pinOrders.filter(isSuccessful).length;
    const fraudOrRto = pinOrders.filter(isFraudOrRto).length;

    return {
      pincode,
      city: region.city,
      district: region.district,
      state: region.state,
      orderCount,
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      successPct: Math.round((delivered / orderCount) * 100),
      fraudPct: Math.round((fraudOrRto / orderCount) * 100),
    };
  });
}

export function buildStateAggregates(pincodes: PincodeMetrics[]): StateAggregate[] {
  const byState = new Map<string, PincodeMetrics[]>();

  for (const pin of pincodes) {
    const list = byState.get(pin.state) ?? [];
    list.push(pin);
    byState.set(pin.state, list);
  }

  return Array.from(byState.entries()).map(([state, pins]) => {
    const orderCount = pins.reduce((sum, p) => sum + p.orderCount, 0);
    const weightedRisk =
      pins.reduce((sum, p) => sum + p.riskScore * p.orderCount, 0) / orderCount;
    const avgSuccess =
      pins.reduce((sum, p) => sum + p.successPct * p.orderCount, 0) / orderCount;
    const avgFraud =
      pins.reduce((sum, p) => sum + p.fraudPct * p.orderCount, 0) / orderCount;
    const avgRiskScore = Math.round(weightedRisk);

    return {
      state,
      orderCount,
      pincodeCount: pins.length,
      avgRiskScore,
      riskLevel: getRiskLevel(avgRiskScore),
      successPct: Math.round(avgSuccess),
      fraudPct: Math.round(avgFraud),
    };
  });
}

export function filterPincodeMetrics(
  pincodes: PincodeMetrics[],
  options: {
    riskLevels?: RiskLevel[];
    state?: string;
    minVolume?: number;
  }
): PincodeMetrics[] {
  let result = pincodes;

  if (options.riskLevels?.length) {
    const allowed = new Set(options.riskLevels);
    result = result.filter((p) => allowed.has(p.riskLevel));
  }

  if (options.state) {
    result = result.filter((p) => p.state === options.state);
  }

  if (options.minVolume != null && options.minVolume > 1) {
    result = result.filter((p) => p.orderCount >= options.minVolume!);
  }

  return result;
}
