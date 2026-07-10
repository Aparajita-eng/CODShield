"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
} from "lucide-react";

// --- Type Definitions ---
type OrderStatus = "Pending" | "Verified" | "Shipped" | "Delivered" | "RTO" | "Cancelled";
type RiskLevel = "Low" | "Medium" | "High";
type RiskDecision = "Auto-approved" | "Manual review" | "Auto-flagged";
type ClaimStatus = "Pending" | "Open" | "Under Review" | "Resolved" | "Rejected";

interface OrderDetail {
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

// --- Helper Functions ---
const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case "Verified":
    case "Delivered":
      return "var(--positive)";
    case "Pending":
    case "Shipped":
      return "var(--warning)";
    case "RTO":
    case "Cancelled":
      return "var(--negative)";
    default:
      return "var(--ink-secondary)";
  }
};

const getRiskColor = (level: RiskLevel) => {
  switch (level) {
    case "Low":
      return "var(--positive)";
    case "Medium":
      return "var(--warning)";
    case "High":
      return "var(--negative)";
    default:
      return "var(--ink-secondary)";
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// --- Mock Data Fetch ---
const mockFetchOrder = async (orderId: string): Promise<OrderDetail> => {
  await new Promise(r => setTimeout(r, 500));
  
  // Create a consistent sample order based on orderId (for uniqueness)
  return {
    id: orderId,
    status: ["Pending", "Verified", "Shipped", "Delivered", "RTO"][Math.floor(Math.random() * 5)] as OrderStatus,
    customer: {
      name: "Rahul Sharma",
      phone: "+91 9876543210",
      email: "rahul.sharma@example.com",
      pastOrderCount: 12,
      pastRtoRate: 8.3,
    },
    address: {
      line1: "123, Main Street",
      line2: "Sector 45",
      city: "Gurugram",
      state: "Haryana",
      pincode: "122001",
      pincodeRisk: "Medium",
    },
    value: 2499,
    riskScore: 45,
    riskBreakdown: [
      { factor: "Pincode Risk", weight: 0.3, contribution: 15 },
      { factor: "Customer History", weight: 0.4, contribution: 20 },
      { factor: "Order Value vs Avg", weight: 0.2, contribution: 8 },
      { factor: "OTP Status", weight: 0.1, contribution: 2 },
    ],
    otpHistory: [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        channel: "SMS",
        status: "Sent",
        attemptCount: 1,
      },
      {
        timestamp: new Date(Date.now() - 3500000).toISOString(),
        channel: "WhatsApp",
        status: "Verified",
        attemptCount: 2,
      },
    ],
    fraudEvents: [
      {
        id: "fe1",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        message: "Pincode flagged high-RTO",
        severity: "Medium",
      },
    ],
    timeline: [
      {
        id: "t1",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        title: "Order Placed",
        description: "Order received from customer",
      },
      {
        id: "t2",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        title: "OTP Sent",
        description: "OTP sent to +91 9876543210",
      },
      {
        id: "t3",
        timestamp: new Date(Date.now() - 3500000).toISOString(),
        title: "OTP Verified",
        description: "Customer confirmed delivery address",
      },
      {
        id: "t4",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        title: "Risk Scored",
        description: "Order assigned risk score of 45",
      },
      {
        id: "t5",
        timestamp: new Date(Date.now() - 900000).toISOString(),
        title: "Status Changed",
        description: "Order marked as Verified",
      },
    ],
    claim: { id: "cl1", status: "Pending", type: "RTO Dispute" },
    otpVerified: true,
    riskDecision: "Manual review",
    items: [
      { name: "Wireless Bluetooth Headphones", quantity: 1, price: 2499 },
    ],
    paymentMethod: "COD",
  };
};

// --- Badge Component ---
const StatusBadge = ({ status, color }: { status: string, color: string }) => (
  <div
    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
    style={{ backgroundColor: `${color}20`, color: color, border: `1px solid ${color}40` }}
  >
    {status}
  </div>
);

// --- Main Page Component ---
export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPhone, setShowPhone] = useState(false);

  // --- Fetch Data ---
  useEffect(() => {
    (async () => {
      const data = await mockFetchOrder(orderId);
      setOrder(data);
      setLoading(false);
    })();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="text-ink-secondary">Loading order details...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="text-ink-secondary font-medium">Order not found</span>
        <Link href="/dashboard/orders" className="text-accent hover:text-accent/80 font-medium">
          Back to Orders
        </Link>
      </div>
    );
  }

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-ink-primary">{order.id}</h1>
            <p className="text-xs text-ink-secondary mt-1">
              {new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex gap-3">
            <StatusBadge status={order.status} color={getStatusColor(order.status)} />
            <StatusBadge
              status={`${order.riskScore} · ${order.riskScore <= 30 ? "Low" : order.riskScore <=70 ? "Medium" : "High"}`}
              color={getRiskColor(order.riskScore <= 30 ? "Low" : order.riskScore <=70 ? "Medium" : "High")}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-default bg-bg-base hover:bg-bg-raised text-sm font-semibold text-ink-primary transition-colors">
            <AlertTriangle className="w-4 h-4" />
            Flag as Fraud
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-default bg-bg-base hover:bg-bg-raised text-sm font-semibold text-ink-primary transition-colors">
            <XCircle className="w-4 h-4" />
            Cancel Order
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent hover:bg-accent/90 text-sm font-semibold text-ink-inverse transition-colors">
            <CheckCircle2 className="w-4 h-4" />
            Approve
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
        {/* Left Column: Main Content */}
        <div className="space-y-6">
          {/* 1. Customer Section */}
          <section className="bg-bg-raised border border-border-default rounded-lg p-5">
            <h2 className="text-sm font-semibold text-ink-primary uppercase tracking-wider mb-4">Customer</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-ink-tertiary text-xs uppercase">Name</span>
                <p className="text-ink-primary font-medium">{order.customer.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-ink-tertiary text-xs uppercase">Phone</span>
                <div className="flex items-center gap-2">
                  <p className="text-ink-primary font-mono">
                    {showPhone ? order.customer.phone : order.customer.phone.slice(0, 6) + "••••••" + order.customer.phone.slice(-2)}
                  </p>
                  <button onClick={() => setShowPhone(!showPhone)} className="text-ink-tertiary hover:text-ink-primary">
                    {showPhone ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-ink-tertiary text-xs uppercase">Email</span>
                <p className="text-ink-primary">{order.customer.email}</p>
              </div>
              <div className="space-y-1">
                <span className="text-ink-tertiary text-xs uppercase">Past Orders</span>
                <p className="text-ink-primary">{order.customer.pastOrderCount} orders</p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <span className="text-ink-tertiary text-xs uppercase">Past RTO/Cancellation Rate</span>
                <p className="text-ink-primary">{order.customer.pastRtoRate}%</p>
              </div>
            </div>
          </section>

          {/* 2. Address Section */}
          <section className="bg-bg-raised border border-border-default rounded-lg p-5">
            <h2 className="text-sm font-semibold text-ink-primary uppercase tracking-wider mb-4">Address</h2>
            <div className="space-y-2 text-sm">
              <p className="text-ink-primary">{order.address.line1}</p>
              {order.address.line2 && <p className="text-ink-primary">{order.address.line2}</p>}
              <p className="text-ink-primary">{order.address.city}, {order.address.state} {order.address.pincode}</p>
              <div className="flex items-center gap-3">
                <span className="text-ink-tertiary text-xs uppercase">Pincode Risk</span>
                <StatusBadge status={order.address.pincodeRisk} color={getRiskColor(order.address.pincodeRisk)} />
              </div>
            </div>
          </section>

          {/* 3. Risk Breakdown */}
          <section className="bg-bg-raised border border-border-default rounded-lg p-5">
            <h2 className="text-sm font-semibold text-ink-primary uppercase tracking-wider mb-4">Risk Breakdown</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-tertiary">Overall Risk Score</span>
                <span className="text-2xl font-bold font-mono text-ink-primary">{order.riskScore}</span>
              </div>
              {order.riskBreakdown.map((factor, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-secondary">{factor.factor}</span>
                    <span className="text-ink-primary font-mono">{factor.contribution}</span>
                  </div>
                  <div className="h-2 bg-bg-sunken rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${(factor.contribution / order.riskScore) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. OTP History */}
          <section className="bg-bg-raised border border-border-default rounded-lg p-5">
            <h2 className="text-sm font-semibold text-ink-primary uppercase tracking-wider mb-4">OTP History</h2>
            {order.otpHistory.length === 0 ? (
              <p className="text-ink-secondary text-sm">No OTP attempts yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-default">
                      <th className="text-left text-xs font-semibold text-ink-tertiary uppercase pb-2">Timestamp</th>
                      <th className="text-left text-xs font-semibold text-ink-tertiary uppercase pb-2">Channel</th>
                      <th className="text-left text-xs font-semibold text-ink-tertiary uppercase pb-2">Status</th>
                      <th className="text-left text-xs font-semibold text-ink-tertiary uppercase pb-2">Attempt Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.otpHistory.map((otp, i) => (
                      <tr key={i} className="border-b border-border-subtle last:border-b-0">
                        <td className="py-2 text-xs text-ink-primary">{formatDate(otp.timestamp)}</td>
                        <td className="py-2 text-xs text-ink-primary">{otp.channel}</td>
                        <td className="py-2">
                          <StatusBadge
                            status={otp.status}
                            color={otp.status === "Verified" ? getRiskColor("Low") : otp.status === "Sent" ? getRiskColor("Medium") : getRiskColor("High")}
                          />
                        </td>
                        <td className="py-2 text-xs text-ink-primary font-mono">{otp.attemptCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 5. Fraud Events */}
          <section className="bg-bg-raised border border-border-default rounded-lg p-5">
            <h2 className="text-sm font-semibold text-ink-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-ink-tertiary" />
              Fraud Events
            </h2>
            {order.fraudEvents.length === 0 ? (
              <p className="text-ink-secondary text-sm">No fraud events detected</p>
            ) : (
              <div className="space-y-4">
                {order.fraudEvents.map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="mt-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: getRiskColor(event.severity) }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-ink-primary">{event.message}</p>
                        <span className="text-xs text-ink-tertiary">{formatDate(event.timestamp)}</span>
                      </div>
                      <StatusBadge status={event.severity} color={getRiskColor(event.severity)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 6. Timeline */}
          <section className="bg-bg-raised border border-border-default rounded-lg p-5">
            <h2 className="text-sm font-semibold text-ink-primary uppercase tracking-wider mb-4">Timeline</h2>
            <div className="space-y-4">
              {order.timeline.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-3"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                    {i < order.timeline.length - 1 && <div className="w-0.5 flex-1 bg-border-default" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink-primary">{event.title}</p>
                      <span className="text-xs text-ink-tertiary font-mono">{formatDate(event.timestamp)}</span>
                    </div>
                    <p className="text-xs text-ink-secondary mt-1">{event.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {/* Order Summary Card */}
          <div className="bg-bg-raised border border-border-default rounded-lg p-5">
            <h3 className="text-sm font-semibold text-ink-primary uppercase tracking-wider mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-ink-primary flex items-center gap-2">
                    <span>{item.quantity}x</span>
                    <span>{item.name}</span>
                  </span>
                  <span className="text-ink-primary font-mono">{formatCurrency(item.price)}</span>
                </div>
              ))}
              <div className="border-t border-border-default pt-3 flex justify-between">
                <span className="text-ink-primary font-semibold">COD Amount</span>
                <span className="text-ink-primary font-mono font-bold">{formatCurrency(order.value)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-tertiary uppercase">Payment Method</span>
                <span className="text-ink-secondary">{order.paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Verification Status Card */}
          <div className="bg-bg-raised border border-border-default rounded-lg p-5">
            <h3 className="text-sm font-semibold text-ink-primary uppercase tracking-wider mb-4">Verification Status</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-secondary">OTP Verified</span>
                {order.otpVerified ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-positive" />
                    <span className="text-positive font-semibold">Yes</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-negative" />
                    <span className="text-negative font-semibold">No</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-secondary">Risk Decision</span>
                <StatusBadge status={order.riskDecision} color={
                  order.riskDecision === "Auto-approved" ? getRiskColor("Low") :
                  order.riskDecision === "Manual review" ? getRiskColor("Medium") :
                  getRiskColor("High")
                } />
              </div>
            </div>
          </div>

          {/* Claim Status Card */}
          <div className="bg-bg-raised border border-border-default rounded-lg p-5">
            <h3 className="text-sm font-semibold text-ink-primary uppercase tracking-wider mb-4">Claim Status</h3>
            {order.claim ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-ink-secondary">Claim Type</span>
                  <span className="text-ink-primary font-medium">{order.claim.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-ink-secondary">Status</span>
                  <StatusBadge status={order.claim.status} color={
                    order.claim.status === "Resolved" ? getRiskColor("Low") :
                    order.claim.status === "Under Review" || order.claim.status === "Pending" || order.claim.status === "Open" ? getRiskColor("Medium") :
                    order.claim.status === "Rejected" ? getRiskColor("High") : getRiskColor("Medium")
                  } />
                </div>
                <Link href="/dashboard/claims" className="text-accent hover:text-accent/80 font-semibold text-sm">
                  View Claim
                </Link>
              </div>
            ) : (
              <p className="text-ink-secondary text-sm">No claim has been submitted</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
