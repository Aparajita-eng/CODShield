export type OrderStatus = "Pending" | "Verified" | "Shipped" | "Delivered" | "RTO" | "Cancelled";
export type RiskLevel = "Low" | "Medium" | "High";

export interface Order {
  id: string;
  merchantId?: string;
  customerName: string;
  phone: string;
  pincode: string;
  value: number;
  riskScore: number;
  status: OrderStatus;
  protectionStatus?: string;
  orderDate: string;
  riskFactors: string[];
  otpVerified: boolean;
  fraudFlagged?: boolean;
  timeline: { date: string; status: string; description: string }[];
}

export interface OrderDetail extends Omit<Order, "timeline"> {
  customer: {
    name: string;
    phone: string;
    email: string;
    pastOrderCount: number;
    pastRtoRate: number;
  };
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    pincodeRisk: RiskLevel;
  };
  riskBreakdown: { factor: string; weight: number; contribution: number }[];
  otpHistory: {
    timestamp: string;
    channel: "SMS" | "WhatsApp" | "Call";
    status: "Sent" | "Verified" | "Expired" | "Failed";
    attemptCount: number;
  }[];
  fraudEvents: {
    id: string;
    timestamp: string;
    message: string;
    severity: RiskLevel;
  }[];
  timeline: {
    id: string;
    timestamp: string;
    title: string;
    description: string;
  }[];
  claim?: { id: string; status: string; type: string };
  riskDecision: string;
  items: { name: string; quantity: number; price: number }[];
  paymentMethod: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

export function getRiskLevelFromScore(score: number): RiskLevel {
  if (score <= 30) return "Low";
  if (score <= 70) return "Medium";
  return "High";
}

export async function fetchOrders(merchantId?: string) {
  const url = merchantId
    ? `${BACKEND_URL}/api/orders?merchantId=${merchantId}`
    : `${BACKEND_URL}/api/orders`;
  const res = await fetch(url);
  return res.json() as Promise<{
    success: boolean;
    orders: Order[];
    merchants: { id: string; name: string }[];
    selectedMerchantId: string;
    message?: string;
  }>;
}

export async function fetchOrderById(orderId: string) {
  const res = await fetch(`${BACKEND_URL}/api/orders/${orderId}`);
  return res.json() as Promise<{ success: boolean; order?: OrderDetail; message?: string }>;
}

export async function bulkUpdateOrders(orderIds: string[], action: "verify" | "flag_fraud") {
  const res = await fetch(`${BACKEND_URL}/api/orders/bulk`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderIds, action }),
  });
  return res.json() as Promise<{ success: boolean; orders?: Order[]; message?: string }>;
}
