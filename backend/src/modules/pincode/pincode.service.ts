import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { fetchOrders } from '../../lib/dataAccess';
import { listKnownStates } from '../../lib/pincodeLookup';
import { buildPincodeMetrics, buildStateAggregates, filterPincodeMetrics, getRiskLevel, RiskLevel } from '../../lib/pincodeMetrics';

@Injectable()
export class PincodeService {
  async getPincodeIntelligence(merchantId: string, query: any) {
    const riskLevels = this.parseRiskLevels(query.riskLevels);
    const state = query.state || undefined;
    const minVolume = Math.max(1, parseInt(query.minVolume || "1", 10) || 1);
    const startDate = query.startDate;
    const endDate = query.endDate;

    const orders = await fetchOrders({
      where: {
        merchantId,
        ...this.buildDateWhere(startDate, endDate),
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

    return {
      minVolume,
      totalOrders: orders.length,
      pincodes: filtered.sort((a, b) => b.riskScore - a.riskScore),
      stateAggregates: stateAggregates.sort((a, b) => b.avgRiskScore - a.avgRiskScore),
      riskDistribution,
      fraudVolumeScatter,
      topRisky,
      states: allStates,
    };
  }

  async getPincodeDetail(merchantId: string, pincode: string, query: any) {
    if (!/^\d{6}$/.test(pincode)) {
      throw new BadRequestException("Valid 6-digit pincode required");
    }

    const startDate = query.startDate;
    const endDate = query.endDate;

    const orders = await fetchOrders({
      where: {
        merchantId,
        pincode,
        ...this.buildDateWhere(startDate, endDate),
      },
      orderBy: { createdAt: "desc" },
    });

    if (!orders.length) {
      throw new NotFoundException("Pincode not found");
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
      riskScore: o.riskScore ?? 0,
      riskLevel: getRiskLevel(o.riskScore ?? 0),
      fraudFlagged: o.fraudFlagged,
    }));

    return {
      pincode: metrics,
      monthlyTrend,
      recentOrders,
    };
  }

  private parseRiskLevels(raw: string | undefined): RiskLevel[] | undefined {
    if (!raw) return undefined;
    const levels = raw
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is RiskLevel => ["Low", "Medium", "High"].includes(s));
    return levels.length ? levels : undefined;
  }

  private buildDateWhere(startDate?: string, endDate?: string) {
    const where: any = {};
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
}
