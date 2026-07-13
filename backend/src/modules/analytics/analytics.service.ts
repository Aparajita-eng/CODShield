import { Injectable } from '@nestjs/common';
import { fetchOrders } from '../../lib/dataAccess';

@Injectable()
export class AnalyticsService {
  async getAnalyticsData(merchantId: string, timelineQuery: string) {
    const timeline = (timelineQuery || "all").toLowerCase();

    // Fetch all orders for this merchant
    const allOrders = await fetchOrders({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
    });

    const now = Date.now();
    const dayMs = 86_400_000;

    let periodStart = 0;
    let priorPeriodStart = 0;
    let priorPeriodEnd = 0;

    if (timeline === "today") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      periodStart = todayStart.getTime();
      priorPeriodStart = periodStart - dayMs;
      priorPeriodEnd = periodStart;
    } else if (timeline === "7d") {
      periodStart = now - 7 * dayMs;
      priorPeriodStart = now - 14 * dayMs;
      priorPeriodEnd = periodStart;
    } else if (timeline === "30d") {
      periodStart = now - 30 * dayMs;
      priorPeriodStart = now - 60 * dayMs;
      priorPeriodEnd = periodStart;
    } else if (timeline === "90d") {
      periodStart = now - 90 * dayMs;
      priorPeriodStart = now - 180 * dayMs;
      priorPeriodEnd = periodStart;
    } else {
      periodStart = 0;
    }

    // Filter current period orders
    const currentOrders = allOrders.filter(o => o.createdAt.getTime() >= periodStart);

    // Blocked Fraud count (current period)
    const currentBlockedOrders = currentOrders.filter(o => o.fraudFlagged && o.protectionStatus === "Failed");
    const blockedFraudCount = currentBlockedOrders.length;

    // Money Saved (current period)
    const moneySaved = currentBlockedOrders.reduce((sum, o) => sum + o.value, 0);

    // Revenue Saved (current period)
    const currentProtectedOrders = currentOrders.filter(o => o.protectionStatus === "Protected");
    const revenueSaved = currentProtectedOrders.reduce((sum, o) => sum + o.value, 0);

    // OTP Success rate (current period)
    const currentVerified = currentOrders.filter(o => o.fulfillmentStatus === "Verified" || o.fulfillmentStatus === "Delivered" || o.fulfillmentStatus === "Shipped").length;
    const currentHeld = currentOrders.filter(o => o.protectionStatus === "Held" || o.protectionStatus === "Failed").length;
    const currentAttempts = currentVerified + currentHeld;
    const otpSuccessRate = currentAttempts > 0 ? (currentVerified / currentAttempts) * 100 : 88.5;

    // RTO Reduction rate (current vs prior period)
    let currentRtoRate = 0;
    let priorRtoRate = 35.0;

    const currentDeliveredRto = currentOrders.filter(o => o.fulfillmentStatus === "Delivered" || o.fulfillmentStatus === "RTO");
    const currentRtoCount = currentDeliveredRto.filter(o => o.fulfillmentStatus === "RTO").length;
    if (currentDeliveredRto.length > 0) {
      currentRtoRate = (currentRtoCount / currentDeliveredRto.length) * 100;
    }

    if (timeline !== "all") {
      const priorOrders = allOrders.filter(o => o.createdAt.getTime() >= priorPeriodStart && o.createdAt.getTime() < priorPeriodEnd);
      const priorDeliveredRto = priorOrders.filter(o => o.fulfillmentStatus === "Delivered" || o.fulfillmentStatus === "RTO");
      const priorRtoCount = priorDeliveredRto.filter(o => o.fulfillmentStatus === "RTO").length;
      if (priorDeliveredRto.length > 0) {
        priorRtoRate = (priorRtoCount / priorDeliveredRto.length) * 100;
      }
    }

    const rtoReduction = priorRtoRate - currentRtoRate;

    // Categories breakdown (Phone, Identity, Pincode)
    const categoriesMap = new Map<string, number>();
    categoriesMap.set("Blacklisted Phone", 0);
    categoriesMap.set("Identity Anomaly", 0);
    categoriesMap.set("Other Risk", 0);

    for (const o of currentBlockedOrders) {
      const reason = (o.statusReason || "").toLowerCase();
      if (reason.includes("phone") || reason.includes("blacklist")) {
        categoriesMap.set("Blacklisted Phone", (categoriesMap.get("Blacklisted Phone") || 0) + 1);
      } else if (reason.includes("device") || reason.includes("mismatch") || reason.includes("identity")) {
        categoriesMap.set("Identity Anomaly", (categoriesMap.get("Identity Anomaly") || 0) + 1);
      } else {
        categoriesMap.set("Other Risk", (categoriesMap.get("Other Risk") || 0) + 1);
      }
    }

    const fraudCategories = Array.from(categoriesMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    // Risk level band sizes
    const riskLevels = [
      { name: "Low", value: currentOrders.filter(o => o.riskScore < 40).length, color: "var(--positive)" },
      { name: "Medium", value: currentOrders.filter(o => o.riskScore >= 40 && o.riskScore < 75).length, color: "var(--warning)" },
      { name: "High", value: currentOrders.filter(o => o.riskScore >= 75).length, color: "var(--negative)" },
    ];

    // Trends mapping
    const monthlyMap = new Map<string, { fraud: number; revenue: number }>();
    const sortedTimeline = [...currentOrders].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    for (const o of sortedTimeline) {
      const month = o.createdAt.toISOString().slice(0, 7);
      const entry = monthlyMap.get(month) ?? { fraud: 0, revenue: 0 };
      if (o.fraudFlagged) entry.fraud += 1;
      if (o.protectionStatus === "Protected") entry.revenue += o.value;
      monthlyMap.set(month, entry);
    }

    const fraudTrends = Array.from(monthlyMap.entries()).map(([date, stats]) => ({
      date,
      count: stats.fraud,
    }));

    const revenueSavedTrends = Array.from(monthlyMap.entries()).map(([date, stats]) => ({
      date,
      amount: Math.round(stats.revenue),
    }));

    return {
      timeline,
      metrics: {
        blockedFraudCount,
        moneySaved: Math.round(moneySaved),
        revenueSaved: Math.round(revenueSaved),
        otpSuccessRate: parseFloat(otpSuccessRate.toFixed(1)),
        rtoReduction: parseFloat(rtoReduction.toFixed(1)),
        priorRtoRate: parseFloat(priorRtoRate.toFixed(1)),
        currentRtoRate: parseFloat(currentRtoRate.toFixed(1)),
      },
      charts: {
        fraudTrends,
        revenueSavedTrends,
        fraudCategories,
        riskLevels,
      },
      orders: currentOrders.slice(0, 15).map(o => ({
        id: o.id,
        createdAt: o.createdAt.toISOString(),
        value: o.value,
        riskScore: o.riskScore,
        protectionStatus: o.protectionStatus,
        fulfillmentStatus: o.fulfillmentStatus,
        fraudFlagged: o.fraudFlagged,
        pincode: o.pincode,
        phone: o.phone,
        statusReason: o.statusReason,
      })),
    };
  }
}
