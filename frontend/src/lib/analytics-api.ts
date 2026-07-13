export interface AnalyticsMetrics {
  blockedFraudCount: number;
  moneySaved: number;
  revenueSaved: number;
  otpSuccessRate: number;
  rtoReduction: number;
  priorRtoRate: number;
  currentRtoRate: number;
}

export interface AnalyticsCharts {
  fraudTrends: Array<{ date: string; count: number }>;
  revenueSavedTrends: Array<{ date: string; amount: number }>;
  fraudCategories: Array<{ name: string; value: number }>;
  riskLevels: Array<{ name: string; value: number; color: string }>;
}

export interface AnalyticsOrder {
  id: string;
  createdAt: string;
  value: number;
  riskScore: number;
  protectionStatus: string;
  fulfillmentStatus: string;
  fraudFlagged: boolean;
  pincode: string;
  phone: string;
  statusReason: string;
}

export interface AnalyticsResponse {
  success: boolean;
  selectedMerchantId?: string;
  timeline?: string;
  metrics?: AnalyticsMetrics;
  charts?: AnalyticsCharts;
  orders?: AnalyticsOrder[];
  message?: string;
}

export async function fetchAnalytics(
  timeline?: string,
  merchantId?: string
): Promise<AnalyticsResponse> {
  const params = new URLSearchParams();
  if (timeline) params.append("timeline", timeline);
  if (merchantId) params.append("merchantId", merchantId);

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`/api/analytics${query}`, { cache: "no-store" });
  return res.json();
}
