import { Request, Response } from "express";
import { fetchOrders, fetchBlacklists } from "../lib/dataAccess";
import {
  buildFraudEvents,
  filterFraudEvents,
  type FraudSeverity,
  type InvestigationStatus,
} from "../lib/fraudEvents";

function parseList<T extends string>(raw: string | undefined, allowed: readonly T[]): T[] | undefined {
  if (!raw) return undefined;
  const values = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is T => (allowed as readonly string[]).includes(s));
  return values.length ? values : undefined;
}

export async function listFraudEvents(req: Request, res: Response): Promise<void> {
  try {
    const severities = parseList(req.query.severities as string | undefined, [
      "Low",
      "Medium",
      "High",
    ] as const);
    const statuses = parseList(req.query.statuses as string | undefined, [
      "Open",
      "Under Review",
      "Confirmed",
      "Resolved",
      "Monitoring",
    ] as const);
    const patternCategory = (req.query.patternCategory as string) || undefined;
    const search = (req.query.search as string) || undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const orders = await fetchOrders({ orderBy: { createdAt: "desc" } });
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

    res.json({
      success: true,
      events,
      totalCount: events.length,
      patternCategories,
      summary: {
        open: allEvents.filter((e) => e.investigationStatus === "Open").length,
        high: allEvents.filter((e) => e.severity === "High").length,
        confirmed: allEvents.filter((e) => e.investigationStatus === "Confirmed").length,
      },
    });
  } catch (error) {
    console.error("Fraud events error:", error);
    res.status(500).json({ success: false, message: "Failed to load fraud events" });
  }
}
