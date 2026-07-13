import { Response } from "express";
import { fetchOrders } from "../lib/dataAccess";
import { resolveActiveMerchantId } from "../lib/merchantAccess";
import { AuthenticatedRequest } from "../middleware/requireSession";
import { listKnownStates } from "../lib/pincodeLookup";
import {
  buildPincodeMetrics,
  buildStateAggregates,
  filterPincodeMetrics,
  getRiskLevel,
  type RiskLevel,
} from "../lib/pincodeMetrics";

function parseRiskLevels(raw: string | undefined): RiskLevel[] | undefined {
  if (!raw) return undefined;
  const levels = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is RiskLevel => ["Low", "Medium", "High"].includes(s));
  return levels.length ? levels : undefined;
}

function buildDateWhere(startDate?: string, endDate?: string) {
  const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
  if (startDate) {
    where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    where.createdAt = { ...where.createdAt, lte: end };
  }
  return Object.keys(where).length ? where : undefined;
}

export async function getPincodeIntelligence(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const scope = await resolveActiveMerchantId(
      req.session!,
      req.query.merchantId as string | undefined
    );
    if (!scope.ok) {
      res.status(scope.status).json({ success: false, message: scope.message });
      return;
    }

    const riskLevels = parseRiskLevels(req.query.riskLevels as string | undefined);
    const state = (req.query.state as string) || undefined;
    const minVolume = Math.max(1, parseInt((req.query.minVolume as string) || "1", 10) || 1);
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const orders = await fetchOrders({
      where: {
        merchantId: scope.merchantId,
        ...buildDateWhere(startDate, endDate),
      },
      orderBy: { createdAt: "desc" },
    });

    const allMetrics = buildPincodeMetrics(orders);
    const filtered = filterPincodeMetrics(allMetrics, { riskLevels, state, minVolume });

    const mapEligible = filtered.filter((p) => p.orderCount >= minVolume);
    const stateAggregates = buildStateAggregates(mapEligible);

    const riskDistribution = (["Low", "Medium", "High"] as RiskLevel[]).map((band) => ({
      band,
      count: filtered.filter((p) => p.riskLevel === band).length,
    }));

    const fraudVolumeScatter = filtered.map((p) => ({
      pincode: p.pincode,
      area: p.city !== "Unknown area" ? p.city : p.district,
      state: p.state,
      orderCount: p.orderCount,
      fraudPct: p.fraudPct,
      riskScore: p.riskScore,
      riskLevel: p.riskLevel,
    }));

    const topRisky = [...filtered]
      .filter((p) => p.orderCount >= minVolume)
      .sort((a, b) => b.riskScore - a.riskScore || b.orderCount - a.orderCount)
      .slice(0, 10);

    const statesInData = [...new Set(allMetrics.map((p) => p.state))].sort();
    const knownStates = listKnownStates();
    const allStates = [...new Set([...statesInData, ...knownStates])].sort();

    res.json({
      success: true,
      minVolume,
      totalOrders: orders.length,
      pincodes: filtered.sort((a, b) => b.riskScore - a.riskScore),
      stateAggregates: stateAggregates.sort((a, b) => b.avgRiskScore - a.avgRiskScore),
      riskDistribution,
      fraudVolumeScatter,
      topRisky,
      states: allStates,
    });
  } catch (error) {
    console.error("Pincode intelligence error:", error);
    res.status(500).json({ success: false, message: "Failed to load pincode intelligence" });
  }
}

export async function getPincodeDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const scope = await resolveActiveMerchantId(
      req.session!,
      req.query.merchantId as string | undefined
    );
    if (!scope.ok) {
      res.status(scope.status).json({ success: false, message: scope.message });
      return;
    }

    const pincode = (req.params.pincode || "").trim();
    if (!/^\d{6}$/.test(pincode)) {
      res.status(400).json({ success: false, message: "Valid 6-digit pincode required" });
      return;
    }

    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const orders = await fetchOrders({
      where: {
        merchantId: scope.merchantId,
        pincode,
        ...buildDateWhere(startDate, endDate),
      },
      orderBy: { createdAt: "desc" },
    });

    if (!orders.length) {
      res.status(404).json({ success: false, message: "Pincode not found" });
      return;
    }

    const [metrics] = buildPincodeMetrics(orders);
    const monthlyMap = new Map<string, { orders: number; rto: number; fraud: number }>();

    for (const order of orders) {
      const month = order.createdAt.toISOString().slice(0, 7);
      const entry = monthlyMap.get(month) ?? { orders: 0, rto: 0, fraud: 0 };
      entry.orders += 1;
      if (order.fulfillmentStatus === "RTO") entry.rto += 1;
      if (order.fraudFlagged) entry.fraud += 1;
      monthlyMap.set(month, entry);
    }

    const monthlyTrend = [...monthlyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, stats]) => ({
        month,
        orders: stats.orders,
        rtoRate: Math.round((stats.rto / stats.orders) * 100),
        fraudRate: Math.round((stats.fraud / stats.orders) * 100),
      }));

    const recentOrders = orders.slice(0, 8).map((o) => ({
      id: o.id,
      date: o.createdAt.toISOString(),
      value: o.value,
      status: o.fulfillmentStatus,
      riskScore: o.riskScore,
      riskLevel: getRiskLevel(o.riskScore),
      fraudFlagged: o.fraudFlagged,
    }));

    res.json({
      success: true,
      pincode: metrics,
      monthlyTrend,
      recentOrders,
    });
  } catch (error) {
    console.error("Pincode detail error:", error);
    res.status(500).json({ success: false, message: "Failed to load pincode detail" });
  }
}
