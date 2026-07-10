export type GraphRiskLevel = "Low" | "Medium" | "High";
export type GraphNodeType = "phone" | "pincode" | "session";

export interface TrustGraphNodeData {
  nodeType: GraphNodeType;
  label: string;
  rawValue: string;
  riskLevel: GraphRiskLevel;
  fraudSignalCount: number;
  orderCount: number;
  customerName?: string;
  trustScore?: number;
  trustLabel?: string;
  nodeSubtitle?: string;
  sessionOrderCount?: number;
}

export interface TrustGraphApiNode {
  id: string;
  type: GraphNodeType;
  data: TrustGraphNodeData;
}

export interface TrustGraphApiEdge {
  id: string;
  source: string;
  target: string;
  data: {
    sharedOrderCount: number;
    hasFraud: boolean;
    edgeKind?: "identifier" | "fraud-cluster";
  };
}

export interface TrustGraphFilters {
  phone?: string;
  startDate?: string;
  endDate?: string;
}

export async function fetchTrustGraph(filters: TrustGraphFilters = {}) {
  const params = new URLSearchParams();
  if (filters.phone) params.set("phone", filters.phone);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);

  const qs = params.toString();
  const res = await fetch(`/api/fraud/trust-graph${qs ? `?${qs}` : ""}`);
  return res.json() as Promise<{
    success: boolean;
    nodes: TrustGraphApiNode[];
    edges: TrustGraphApiEdge[];
    isEmpty: boolean;
    orderCount: number;
    focusPhone?: string | null;
    message?: string;
  }>;
}
