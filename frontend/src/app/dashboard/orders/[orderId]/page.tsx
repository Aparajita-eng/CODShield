"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
} from "lucide-react";
import ActivityTimeline from "@/components/ActivityTimeline";
import {
  formatCurrency,
  formatDate,
  getRiskColor,
  getStatusColor,
} from "@/lib/dashboard-ui";
import {
  fetchOrderById,
  type OrderDetail,
} from "@/lib/orders-api";

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

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await fetchOrderById(orderId);
      if (!active) return;
      setOrder(result.success && result.order ? result.order : null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
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
            <ActivityTimeline events={order.timeline} />
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
