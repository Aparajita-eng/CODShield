export type OrderStatus = "Pending" | "Verified" | "Shipped" | "Delivered" | "RTO" | "Cancelled";
export type RiskLevel = "Low" | "Medium" | "High";
export type RiskDecision = "Auto-approved" | "Manual review" | "Auto-flagged";
export type ClaimStatus = "Pending" | "Open" | "Under Review" | "Resolved" | "Rejected";

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  pincode: string;
  value: number;
  riskScore: number;
  status: OrderStatus;
  orderDate: string;
  riskFactors: string[];
  otpVerified: boolean;
  timeline: { date: string; status: string; description: string }[];
}

export interface OrderDetail {
  id: string;
  status: OrderStatus;
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
  value: number;
  riskScore: number;
  riskBreakdown: {
    factor: string;
    weight: number;
    contribution: number;
  }[];
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
  claim?: {
    id: string;
    status: ClaimStatus;
    type: string;
  };
  otpVerified: boolean;
  riskDecision: RiskDecision;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  paymentMethod: string;
}

export const sampleOrders: Order[] = [
  {
    id: "COD-8342",
    customerName: "Rahul Sharma",
    phone: "+91 9876543210",
    pincode: "110001",
    value: 2499,
    riskScore: 12,
    status: "Delivered",
    orderDate: "2025-07-09T10:30:00Z",
    riskFactors: ["Low RTO history", "Pincode low risk", "Verified phone"],
    otpVerified: true,
    timeline: [
      { date: "2025-07-05", status: "Order Placed", description: "Order received from customer" },
      { date: "2025-07-06", status: "Verified", description: "OTP verified successfully" },
      { date: "2025-07-07", status: "Shipped", description: "Dispatched to logistics" },
      { date: "2025-07-09", status: "Delivered", description: "Delivered to customer" },
    ],
  },
  {
    id: "COD-8341",
    customerName: "Priya Mehta",
    phone: "+91 8765432109",
    pincode: "400001",
    value: 5999,
    riskScore: 68,
    status: "Shipped",
    orderDate: "2025-07-08T14:15:00Z",
    riskFactors: ["High order value", "Pincode medium risk"],
    otpVerified: false,
    timeline: [
      { date: "2025-07-06", status: "Order Placed", description: "Order received from customer" },
      { date: "2025-07-08", status: "Shipped", description: "Dispatched to logistics" },
    ],
  },
  {
    id: "COD-8340",
    customerName: "Amit Patel",
    phone: "+91 7654321098",
    pincode: "560001",
    value: 1299,
    riskScore: 45,
    status: "Pending",
    orderDate: "2025-07-10T09:45:00Z",
    riskFactors: ["Pincode medium risk"],
    otpVerified: false,
    timeline: [
      { date: "2025-07-10", status: "Order Placed", description: "Order received from customer" },
    ],
  },
  {
    id: "COD-8339",
    customerName: "Neha Singh",
    phone: "+91 9988776655",
    pincode: "600001",
    value: 3499,
    riskScore: 89,
    status: "RTO",
    orderDate: "2025-06-28T11:20:00Z",
    riskFactors: ["High RTO history", "Pincode high risk"],
    otpVerified: false,
    timeline: [
      { date: "2025-06-28", status: "Order Placed", description: "Order received from customer" },
      { date: "2025-06-30", status: "Shipped", description: "Dispatched to logistics" },
      { date: "2025-07-05", status: "RTO", description: "Returned to origin" },
    ],
  },
  {
    id: "COD-8338",
    customerName: "Rohit Verma",
    phone: "+91 9123456789",
    pincode: "700001",
    value: 899,
    riskScore: 5,
    status: "Verified",
    orderDate: "2025-07-09T16:00:00Z",
    riskFactors: ["Low RTO history", "Verified phone"],
    otpVerified: true,
    timeline: [
      { date: "2025-07-09", status: "Order Placed", description: "Order received from customer" },
      { date: "2025-07-09", status: "Verified", description: "OTP verified successfully" },
    ],
  },
  {
    id: "COD-8337",
    customerName: "Sneha Gupta",
    phone: "+91 8800112233",
    pincode: "201301",
    value: 7999,
    riskScore: 95,
    status: "Cancelled",
    orderDate: "2025-06-25T13:00:00Z",
    riskFactors: ["High RTO history", "High order value", "Pincode high risk"],
    otpVerified: false,
    timeline: [
      { date: "2025-06-25", status: "Order Placed", description: "Order received from customer" },
      { date: "2025-06-26", status: "Cancelled", description: "Order cancelled by customer" },
    ],
  },
  {
    id: "COD-8336",
    customerName: "Vikram Yadav",
    phone: "+91 9966554433",
    pincode: "500001",
    value: 1999,
    riskScore: 22,
    status: "Delivered",
    orderDate: "2025-07-03T10:00:00Z",
    riskFactors: ["Low RTO history"],
    otpVerified: true,
    timeline: [
      { date: "2025-07-03", status: "Order Placed", description: "Order received from customer" },
      { date: "2025-07-03", status: "Verified", description: "OTP verified successfully" },
      { date: "2025-07-04", status: "Shipped", description: "Dispatched to logistics" },
      { date: "2025-07-06", status: "Delivered", description: "Delivered to customer" },
    ],
  },
  {
    id: "COD-8335",
    customerName: "Ritu Jain",
    phone: "+91 9432109876",
    pincode: "302001",
    value: 4599,
    riskScore: 55,
    status: "Shipped",
    orderDate: "2025-07-07T15:30:00Z",
    riskFactors: ["Pincode medium risk"],
    otpVerified: true,
    timeline: [
      { date: "2025-07-07", status: "Order Placed", description: "Order received from customer" },
      { date: "2025-07-07", status: "Verified", description: "OTP verified successfully" },
      { date: "2025-07-08", status: "Shipped", description: "Dispatched to logistics" },
    ],
  },
];

const PINCODE_LOCATIONS: Record<string, { city: string; state: string; line1: string; line2?: string }> = {
  "110001": { city: "New Delhi", state: "Delhi", line1: "12, Connaught Place" },
  "400001": { city: "Mumbai", state: "Maharashtra", line1: "45, Fort Area", line2: "Near CST" },
  "560001": { city: "Bengaluru", state: "Karnataka", line1: "78, MG Road" },
  "600001": { city: "Chennai", state: "Tamil Nadu", line1: "22, Anna Salai" },
  "700001": { city: "Kolkata", state: "West Bengal", line1: "9, Park Street" },
  "201301": { city: "Noida", state: "Uttar Pradesh", line1: "Sector 18, Block C" },
  "500001": { city: "Hyderabad", state: "Telangana", line1: "3-6-12, Abids" },
  "302001": { city: "Jaipur", state: "Rajasthan", line1: "MI Road, Shop 14" },
};

function getRiskLevel(score: number): RiskLevel {
  if (score <= 30) return "Low";
  if (score <= 70) return "Medium";
  return "High";
}

function getRiskDecision(score: number): RiskDecision {
  if (score <= 30) return "Auto-approved";
  if (score <= 70) return "Manual review";
  return "Auto-flagged";
}

function emailFromName(name: string): string {
  return `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;
}

function buildRiskBreakdown(order: Order) {
  const factorCount = order.riskFactors.length;
  const weight = factorCount > 0 ? 1 / factorCount : 1;
  return order.riskFactors.map((factor) => ({
    factor,
    weight,
    contribution: Math.round(order.riskScore * weight),
  }));
}

function buildOtpHistory(order: Order) {
  const baseTime = new Date(order.orderDate).getTime();
  if (!order.otpVerified) {
    return [
      {
        timestamp: new Date(baseTime + 3600000).toISOString(),
        channel: "SMS" as const,
        status: "Sent" as const,
        attemptCount: 1,
      },
      {
        timestamp: new Date(baseTime + 7200000).toISOString(),
        channel: "WhatsApp" as const,
        status: "Expired" as const,
        attemptCount: 2,
      },
    ];
  }
  return [
    {
      timestamp: new Date(baseTime + 3600000).toISOString(),
      channel: "SMS" as const,
      status: "Sent" as const,
      attemptCount: 1,
    },
    {
      timestamp: new Date(baseTime + 3900000).toISOString(),
      channel: "WhatsApp" as const,
      status: "Verified" as const,
      attemptCount: 2,
    },
  ];
}

function buildFraudEvents(order: Order) {
  if (order.riskScore < 70) return [];
  const baseTime = new Date(order.orderDate).getTime();
  return order.riskFactors.map((factor, i) => ({
    id: `fe-${order.id}-${i}`,
    timestamp: new Date(baseTime + (i + 1) * 1800000).toISOString(),
    message: factor,
    severity: getRiskLevel(order.riskScore),
  }));
}

export function getOrderById(orderId: string): Order | undefined {
  return sampleOrders.find((o) => o.id === orderId);
}

export function getOrderDetailById(orderId: string): OrderDetail | undefined {
  const order = getOrderById(orderId);
  if (!order) return undefined;

  const location = PINCODE_LOCATIONS[order.pincode] ?? {
    city: "Unknown",
    state: "Unknown",
    line1: "Address on file",
  };

  const pastOrderCount = Math.max(1, 20 - order.riskScore);
  const pastRtoRate = Math.min(35, Math.round(order.riskScore / 3));

  return {
    id: order.id,
    status: order.status,
    customer: {
      name: order.customerName,
      phone: order.phone,
      email: emailFromName(order.customerName),
      pastOrderCount,
      pastRtoRate,
    },
    address: {
      line1: location.line1,
      line2: location.line2,
      city: location.city,
      state: location.state,
      pincode: order.pincode,
      pincodeRisk: getRiskLevel(order.riskScore),
    },
    value: order.value,
    riskScore: order.riskScore,
    riskBreakdown: buildRiskBreakdown(order),
    otpHistory: buildOtpHistory(order),
    fraudEvents: buildFraudEvents(order),
    timeline: order.timeline.map((event, i) => ({
      id: `t-${order.id}-${i}`,
      timestamp: new Date(event.date).toISOString(),
      title: event.status,
      description: event.description,
    })),
    claim:
      order.status === "RTO"
        ? { id: `cl-${order.id}`, status: "Pending", type: "RTO Dispute" }
        : undefined,
    otpVerified: order.otpVerified,
    riskDecision: getRiskDecision(order.riskScore),
    items: [{ name: "COD Order Items", quantity: 1, price: order.value }],
    paymentMethod: "COD",
  };
}

export function getRiskLevelFromScore(score: number): RiskLevel {
  return getRiskLevel(score);
}
