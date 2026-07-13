export type FraudSeverity = "Low" | "Medium" | "High";
export type InvestigationStatus =
  | "Open"
  | "Under Review"
  | "Confirmed"
  | "Resolved"
  | "Monitoring";

export interface LinkedOrderSummary {
  id: string;
  phone: string;
  pincode: string;
  value: number;
  riskScore: number;
  status: string;
  orderDate: string;
}

export interface FraudEvent {
  id: string;
  severity: FraudSeverity;
  timeline: string;
  detectedPattern: string;
  patternCategory: string;
  linkedOrders: LinkedOrderSummary[];
  linkedPhoneCount: number;
  investigationStatus: InvestigationStatus;
  clusterId?: string;
}

export interface FraudEventsFilters {
  severities?: FraudSeverity[];
  statuses?: InvestigationStatus[];
  patternCategory?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

const FRAUD_EVENTS_API = "/api/fraud/events";

function buildQuery(filters: FraudEventsFilters): string {
  const params = new URLSearchParams();
  if (filters.severities?.length) params.set("severities", filters.severities.join(","));
  if (filters.statuses?.length) params.set("statuses", filters.statuses.join(","));
  if (filters.patternCategory) params.set("patternCategory", filters.patternCategory);
  if (filters.search) params.set("search", filters.search);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchFraudEvents(filters: FraudEventsFilters = {}) {
  const res = await fetch(`${FRAUD_EVENTS_API}${buildQuery(filters)}`);
  return res.json() as Promise<{
    success: boolean;
    events: FraudEvent[];
    totalCount: number;
    patternCategories: string[];
    summary: { open: number; high: number; confirmed: number };
    message?: string;
  }>;
}
