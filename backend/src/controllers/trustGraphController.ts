import { Request, Response } from "express";
import { fetchOrders, fetchBlacklists } from "../lib/dataAccess";
import { buildTrustGraphFromOrders } from "../lib/trustGraph";

function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]\d{9}$/.test(digits.slice(2))) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0") && /^[6-9]\d{9}$/.test(digits.slice(1))) {
    digits = digits.slice(1);
  }
  return digits;
}

export async function getFraudTrustGraph(req: Request, res: Response): Promise<void> {
  try {
    const focusPhoneRaw = (req.query.phone as string) || "";
    const focusPhone = focusPhoneRaw ? normalizePhone(focusPhoneRaw) : undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const where: {
      createdAt?: { gte?: Date; lte?: Date };
    } = {};

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { ...where.createdAt, lte: end };
    }

    const orders = await fetchOrders({
      where: Object.keys(where).length ? where : undefined,
      orderBy: { createdAt: "desc" },
    });

    const phones = [...new Set(orders.map((o) => o.phone))];
    const blacklists = await fetchBlacklists({ phones });

    let resolvedPhone: string | undefined;
    if (focusPhone) {
      const match = orders.find((o) => normalizePhone(o.phone) === focusPhone);
      resolvedPhone = match?.phone;
    }

    const graph = buildTrustGraphFromOrders(orders, blacklists, resolvedPhone);

    res.json({
      success: true,
      ...graph,
      focusPhone: resolvedPhone ?? null,
    });
  } catch (error) {
    console.error("Trust graph error:", error);
    res.status(500).json({ success: false, message: "Failed to build trust graph" });
  }
}
