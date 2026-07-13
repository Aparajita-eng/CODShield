import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { fetchOrders, fetchBlacklists, fetchBlacklistByPhone } from '../../lib/dataAccess';
import { Order, Blacklist } from '@prisma/client';

type TrustLabel = "Low" | "Medium" | "High";
type Severity = "Low" | "Medium" | "High";

@Injectable()
export class CustomerService {
  async listCustomers(merchantId: string) {
    const grouped = await this.groupOrdersByPhone(merchantId);
    const phones = Array.from(grouped.keys());

    const blacklists = await fetchBlacklists({ phones });
    const blacklistMap = new Map(blacklists.map((b) => [b.phone, b]));

    const customers = phones
      .map((phone) =>
        this.summarizeCustomer(phone, grouped.get(phone)!, blacklistMap.get(phone) ?? null)
      )
      .sort((a, b) => {
        if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
        return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
      })
      .slice(0, 12);

    return customers;
  }

  async searchCustomers(merchantId: string, q: string) {
    const query = this.normalizePhone(q || "");
    if (!query) {
      return [];
    }

    const grouped = await this.groupOrdersByPhone(merchantId, query);
    const phones = Array.from(grouped.keys()).filter((phone) =>
      this.normalizePhone(phone).includes(query)
    );

    const blacklists = await fetchBlacklists({ phones });
    const blacklistMap = new Map(blacklists.map((b) => [b.phone, b]));

    const customers = phones
      .map((phone) =>
        this.summarizeCustomer(phone, grouped.get(phone)!, blacklistMap.get(phone) ?? null)
      )
      .sort((a, b) => b.orderCount - a.orderCount);

    return customers;
  }

  async getCustomerProfile(merchantId: string, phoneParam: string) {
    const normalized = this.normalizePhone(phoneParam);
    if (!normalized) {
      throw new BadRequestException("Phone number is required");
    }

    const orders = await fetchOrders({
      where: { merchantId, phone: { contains: normalized } },
      orderBy: { createdAt: "desc" },
    });

    const exactOrders = orders.filter((o) => this.normalizePhone(o.phone) === normalized);
    if (!exactOrders.length) {
      throw new NotFoundException("Customer not found");
    }

    const phone = exactOrders[0].phone;
    const blacklist = await fetchBlacklistByPhone(phone);
    const { score, label } = this.calculateBuyerTrustScore(exactOrders, blacklist);

    const delivered = exactOrders.filter((o) => o.fulfillmentStatus === "Delivered").length;
    const rto = exactOrders.filter((o) => o.fulfillmentStatus === "RTO").length;
    const total = exactOrders.length;
    const fraudFlags = this.buildFraudFlags(exactOrders, blacklist);

    return {
      phone,
      name: this.displayName(phone),
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
      deliveryBreakdown: this.buildDeliveryBreakdown(exactOrders),
      monthlyTrend: this.buildMonthlyTrend(exactOrders),
      timeline: this.buildCustomerTimeline(exactOrders, blacklist, score),
      fraudFlags,
      pastOrders: exactOrders.map((order) => ({
        id: order.id,
        date: order.createdAt.toISOString(),
        value: order.value,
        status: order.fulfillmentStatus,
      })),
    };
  }

  private async groupOrdersByPhone(merchantId: string, phoneQuery?: string) {
    const where: any = { merchantId };
    if (phoneQuery) {
      where.phone = { contains: phoneQuery };
    }
    const orders = await fetchOrders({
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

  private normalizePhone(input: string): string {
    let digits = input.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91") && /^[6-9]\d{9}$/.test(digits.slice(2))) {
      digits = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith("0") && /^[6-9]\d{9}$/.test(digits.slice(1))) {
      digits = digits.slice(1);
    }
    return digits;
  }

  private displayName(phone: string): string {
    return `Customer • ${phone.slice(-4)}`;
  }

  private trustLabel(score: number): TrustLabel {
    if (score > 70) return "High";
    if (score > 30) return "Medium";
    return "Low";
  }

  private calculateBuyerTrustScore(orders: Order[], blacklist: Blacklist | null) {
    if (!orders.length) return { score: 50, label: "Medium" as TrustLabel };
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
    return { score, label: this.trustLabel(score) };
  }

  private summarizeCustomer(phone: string, orders: Order[], blacklist: Blacklist | null) {
    const { score, label } = this.calculateBuyerTrustScore(orders, blacklist);
    const lastOrder = orders.reduce((latest, order) =>
      order.createdAt > latest.createdAt ? order : latest
    );

    return {
      phone,
      displayName: this.displayName(phone),
      orderCount: orders.length,
      lastOrderDate: lastOrder.createdAt.toISOString(),
      trustScore: score,
      trustLabel: label,
    };
  }

  private buildFraudFlags(orders: Order[], blacklist: Blacklist | null) {
    const flags: any[] = [];
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
      const days = Math.max(1, Math.round((windowEnd.getTime() - windowStart.getTime()) / (1000 * 60 * 60 * 24)));
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
        severity: order.riskScore <= 30 ? "Low" : order.riskScore <= 70 ? "Medium" : "High",
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

  private buildCustomerTimeline(orders: Order[], blacklist: Blacklist | null, trustScore: number) {
    const events: any[] = [];
    const sortedOrders = [...orders].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

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

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  private buildDeliveryBreakdown(orders: Order[]) {
    const counts = { Delivered: 0, RTO: 0, Cancelled: 0, Pending: 0 };
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

  private buildMonthlyTrend(orders: Order[]) {
    if (!orders.length) return [];
    const earliest = orders.reduce((min, order) => (order.createdAt < min ? order.createdAt : min), orders[0].createdAt);
    const cursor = new Date(earliest);
    cursor.setDate(1);
    cursor.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setDate(1);
    end.setHours(0, 0, 0, 0);

    const months: any[] = [];
    while (cursor <= end) {
      const year = cursor.getFullYear();
      const month = cursor.getMonth();
      const next = new Date(year, month + 1, 1);
      const ordersInMonth = orders.filter((o) => o.createdAt >= cursor && o.createdAt < next);
      const rto = ordersInMonth.filter((o) => o.fulfillmentStatus === "RTO").length;

      months.push({
        month: `${year}-${String(month + 1).padStart(2, "0")}`,
        orders: ordersInMonth.length,
        rtoRate: ordersInMonth.length ? Math.round((rto / ordersInMonth.length) * 100) : 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return months.filter((m) => m.orders > 0);
  }
}
