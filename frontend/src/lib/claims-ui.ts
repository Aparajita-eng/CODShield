import type { ClaimDisplayStatus, ClaimRecord } from "@/lib/claims-api";
import { CHART_COLORS } from "@/lib/dashboard-ui";
import {
  formatFullDate,
  formatRelativeTime,
  isWithinTimelinePreset,
  type TimelinePreset,
} from "@/lib/fraud-center-ui";

export type { TimelinePreset };

export const CLAIM_STATUS_OPTIONS: Array<ClaimDisplayStatus | "All"> = [
  "All",
  "Pending",
  "Under Review",
  "Approved",
  "Rejected",
  "Paid",
];

/** Filled badges for terminal outcomes; outline for in-progress (Fraud Center convention). */
export function getClaimStatusBadgeClass(status: ClaimDisplayStatus): string {
  switch (status) {
    case "Pending":
      return "text-warning border-warning/50 bg-transparent";
    case "Under Review":
      return "text-accent border-accent/50 bg-transparent";
    case "Approved":
      return "text-positive bg-positive/8 border-positive/20";
    case "Rejected":
      return "text-negative bg-negative/8 border-negative/20";
    case "Paid":
      return "text-positive bg-positive/8 border-positive/20";
    default:
      return "text-ink-secondary border-border-default bg-transparent";
  }
}

export const CLAIM_STATUS_CHART_COLORS: Record<ClaimDisplayStatus, string> = {
  Pending: CHART_COLORS.warning,
  "Under Review": CHART_COLORS.accent,
  Approved: CHART_COLORS.positive,
  Rejected: CHART_COLORS.negative,
  Paid: CHART_COLORS.positive,
};

export function formatClaimCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function shortOrderId(orderId: string): string {
  return orderId.length > 12 ? `${orderId.slice(0, 8)}…` : orderId;
}

export function filterClaims(
  claims: ClaimRecord[],
  opts: {
    status: ClaimDisplayStatus | "All";
    timeline: TimelinePreset;
    search: string;
  }
): ClaimRecord[] {
  const q = opts.search.trim().toLowerCase();

  return claims.filter((claim) => {
    if (opts.status !== "All" && claim.status !== opts.status) return false;
    if (!isWithinTimelinePreset(claim.submittedAt, opts.timeline)) return false;
    if (q) {
      const haystack = `${claim.orderId} ${claim.phone}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function claimsByStatusChartData(claims: ClaimRecord[]) {
  const counts: Record<string, number> = {};
  for (const claim of claims) {
    counts[claim.status] = (counts[claim.status] ?? 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    color: CLAIM_STATUS_CHART_COLORS[name as ClaimDisplayStatus] ?? CHART_COLORS.inkSecondary,
  }));
}

export function claimsValueOverTimeChartData(claims: ClaimRecord[]) {
  const byMonth = new Map<string, number>();
  for (const claim of claims) {
    const d = new Date(claim.submittedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + claim.amount);
  }
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value }));
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

/** Client-side CSV download from already-fetched claim rows */
export function downloadClaimsCsv(claims: ClaimRecord[], filename = "claims-export.csv"): void {
  const headers = [
    "Claim ID",
    "Order ID",
    "Merchant",
    "Phone",
    "Amount (INR)",
    "Status",
    "Submitted At",
  ];
  const rows = claims.map((c) =>
    [
      c.id,
      c.orderId,
      c.merchantName,
      c.phone,
      c.amount,
      c.status,
      formatFullDate(c.submittedAt),
    ]
      .map(escapeCsvCell)
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export { formatFullDate, formatRelativeTime };
