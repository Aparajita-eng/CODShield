export type TrustLabel = "Low" | "Medium" | "High";
export type Severity = "Low" | "Medium" | "High";

export interface CustomerSummary {
  phone: string;
  displayName: string;
  orderCount: number;
  lastOrderDate: string;
  trustScore: number;
  trustLabel: TrustLabel;
}

export interface FraudFlag {
  id: string;
  type: string;
  date: string;
  severity: Severity;
  orderId?: string;
}

export interface CustomerProfile {
  phone: string;
  name: string;
  email: string | null;
  trustScore: number;
  trustLabel: TrustLabel;
  stats: {
    pastOrders: number;
    successfulDeliveries: number;
    successfulDeliveryPct: number;
    rtoCount: number;
    rtoPct: number;
    fraudFlags: number;
  };
  deliveryBreakdown: { name: string; value: number }[];
  monthlyTrend: { month: string; orders: number; rtoRate: number }[];
  timeline: {
    id: string;
    timestamp: string;
    title: string;
    description: string;
  }[];
  fraudFlags: FraudFlag[];
  pastOrders: {
    id: string;
    date: string;
    value: number;
    status: string;
  }[];
}

const CUSTOMERS_API = "/api/customers";

export async function fetchRecentCustomers() {
  const res = await fetch(`${CUSTOMERS_API}`);
  return res.json() as Promise<{
    success: boolean;
    customers: CustomerSummary[];
    message?: string;
  }>;
}

export async function searchCustomers(query: string) {
  const res = await fetch(`${CUSTOMERS_API}/search?q=${encodeURIComponent(query)}`);
  return res.json() as Promise<{
    success: boolean;
    customers: CustomerSummary[];
    message?: string;
  }>;
}

export async function fetchCustomerProfile(phone: string) {
  const res = await fetch(
    `${CUSTOMERS_API}/profile?phone=${encodeURIComponent(phone)}`
  );
  return res.json() as Promise<{
    success: boolean;
    profile?: CustomerProfile;
    message?: string;
  }>;
}
