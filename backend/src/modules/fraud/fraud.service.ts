import { Injectable } from '@nestjs/common';
import { fetchOrders, fetchBlacklists, fetchBlacklists as fetchBlacklistsDataAccess } from '../../lib/dataAccess';
import { buildFraudEvents, filterFraudEvents, FraudSeverity, InvestigationStatus } from '../../lib/fraudEvents';
import { TrustGraphService } from '../risk/graph.service';

@Injectable()
export class FraudService {
  constructor(private readonly trustGraphService: TrustGraphService) {}

  async listEvents(merchantId: string, query: any) {
    const severities = this.parseList(query.severities, ["Low", "Medium", "High"] as const);
    const statuses = this.parseList(query.statuses, ["Open", "Under Review", "Confirmed", "Resolved", "Monitoring"] as const);
    const patternCategory = query.patternCategory || undefined;
    const search = query.search || undefined;
    const startDate = query.startDate || undefined;
    const endDate = query.endDate || undefined;

    const orders = await fetchOrders({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
    });
    const phones = [...new Set(orders.map((o) => o.phone))];
    const blacklists = await fetchBlacklists({ phones });

    const allEvents = buildFraudEvents(orders, blacklists);
    const events = filterFraudEvents(allEvents, {
      severities: severities as FraudSeverity[] | undefined,
      statuses: statuses as InvestigationStatus[] | undefined,
      patternCategory,
      search,
      startDate,
      endDate,
    });

    const patternCategories = [...new Set(allEvents.map((e) => e.patternCategory))].sort();

    return {
      events,
      totalCount: events.length,
      patternCategories,
      summary: {
        open: allEvents.filter((e) => e.investigationStatus === "Open").length,
        high: allEvents.filter((e) => e.severity === "High").length,
        confirmed: allEvents.filter((e) => e.investigationStatus === "Confirmed").length,
      },
    };
  }

  async getTrustGraph(merchantId: string, query: any) {
    const focusPhoneRaw = query.phone || "";
    const focusPhone = focusPhoneRaw ? this.normalizePhone(focusPhoneRaw) : undefined;
    const startDate = query.startDate;
    const endDate = query.endDate;

    const where: any = { merchantId };

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { ...where.createdAt, lte: end };
    }

    const orders = await fetchOrders({
      where: Object.keys(where).length > 1 ? where : { merchantId },
      orderBy: { createdAt: "desc" },
    });

    const phones = [...new Set(orders.map((o) => o.phone))];
    const blacklists = await fetchBlacklistsDataAccess({ phones });

    let resolvedPhone: string | undefined;
    if (focusPhone) {
      const match = orders.find((o) => this.normalizePhone(o.phone) === focusPhone);
      resolvedPhone = match?.phone;
    }

    const graph = this.trustGraphService.buildGraph(orders, blacklists, resolvedPhone);

    return {
      ...graph,
      focusPhone: resolvedPhone ?? null,
    };
  }

  private parseList<T extends string>(raw: string | undefined, allowed: readonly T[]): T[] | undefined {
    if (!raw) return undefined;
    const values = raw
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is T => (allowed as readonly string[]).includes(s));
    return values.length ? values : undefined;
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
}
