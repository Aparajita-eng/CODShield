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

export interface PincodeIntelligenceFilters {
  riskLevels?: RiskLevel[];
  state?: string;
  minVolume?: number;
  startDate?: string;
  endDate?: string;
}

export interface PincodeIntelligenceResponse {
  success: boolean;
  minVolume: number;
  totalOrders: number;
  pincodes: PincodeMetrics[];
  stateAggregates: StateAggregate[];
  riskDistribution: { band: RiskLevel; count: number }[];
  fraudVolumeScatter: {
    pincode: string;
    area: string;
    state: string;
    orderCount: number;
    fraudPct: number;
    riskScore: number;
    riskLevel: RiskLevel;
  }[];
  topRisky: PincodeMetrics[];
  states: string[];
  message?: string;
}

export interface PincodeDetailResponse {
  success: boolean;
  pincode?: PincodeMetrics;
  monthlyTrend?: { month: string; orders: number; rtoRate: number; fraudRate: number }[];
  recentOrders?: {
    id: string;
    date: string;
    value: number;
    status: string;
    riskScore: number;
    riskLevel: RiskLevel;
    fraudFlagged: boolean;
  }[];
  message?: string;
}

const PINCODE_API = "/api/pincodes";

function buildQuery(filters: PincodeIntelligenceFilters): string {
  const params = new URLSearchParams();
  if (filters.riskLevels?.length) params.set("riskLevels", filters.riskLevels.join(","));
  if (filters.state) params.set("state", filters.state);
  if (filters.minVolume != null) params.set("minVolume", String(filters.minVolume));
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchPincodeIntelligence(filters: PincodeIntelligenceFilters = {}) {
  const res = await fetch(`${PINCODE_API}/intelligence${buildQuery(filters)}`);
  return res.json() as Promise<PincodeIntelligenceResponse>;
}

export async function fetchPincodeDetail(
  pincode: string,
  filters: Pick<PincodeIntelligenceFilters, "startDate" | "endDate"> = {}
) {
  const params = new URLSearchParams();
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  const qs = params.toString();
  const res = await fetch(`${PINCODE_API}/${pincode}/detail${qs ? `?${qs}` : ""}`);
  return res.json() as Promise<PincodeDetailResponse>;
}
