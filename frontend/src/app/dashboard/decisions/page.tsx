"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, RefreshCw, CheckCircle2, XCircle, Truck, AlertTriangle,
  ChevronRight, Filter, Phone, MapPin, User, FileText
} from "lucide-react";

export default function DecisionQueuePage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const res = await fetch("/api/orders?status=Held");
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch {
      console.error("Failed to load decision queue orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleApproveDispatch = async (orderId: string, courier?: string) => {
    setActioningId(orderId);
    try {
      await fetch(`/api/workflow/orders/${orderId}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courier }),
      });
      await loadOrders();
    } catch {
      alert("Failed to dispatch order.");
    } finally {
      setActioningId(null);
    }
  };

  const handleTriggerVerification = async (orderId: string) => {
    setActioningId(orderId);
    try {
      await fetch(`/api/workflow/orders/${orderId}/verify`, { method: "POST" });
      alert("Customer verification triggered via WhatsApp/AI Call.");
      await loadOrders();
    } catch {
      alert("Failed to trigger verification.");
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div style={{ padding: 32, maxWidth: 1040, margin: "0 auto" }}>
      <style>{`
        .dq-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .dq-eyebrow { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: var(--accent, #059669); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .dq-title { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 4px; }
        .dq-sub { font-size: 13px; color: #6b7280; margin: 0; }

        .dq-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .dq-card-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f3f4f6; padding-bottom: 12px; margin-bottom: 14px; }
        .dq-order-id { font-size: 15px; font-weight: 700; color: #111827; }
        .dq-badge-held { background: rgba(217,119,6,0.1); color: #d97706; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }

        .dq-grid { display: grid; grid-template-columns: 2fr 1.5fr 1fr; gap: 16px; }
        .dq-box { background: #f9fafb; border-radius: 8px; padding: 12px; font-size: 12px; }
        .dq-box-title { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 6px; }

        .dq-rec-item { padding: 6px 8px; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; }
        .dq-rec-rank { font-weight: 700; color: var(--accent, #059669); }

        .dq-actions { display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end; }
        .dq-btn-pri { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 6px; background: var(--accent, #059669); color: #fff; border: none; font-size: 12px; font-weight: 600; cursor: pointer; }
        .dq-btn-sec { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 6px; background: #fff; color: #374151; border: 1px solid #d1d5db; font-size: 12px; font-weight: 600; cursor: pointer; }
      `}</style>

      <div className="dq-header">
        <div>
          <div className="dq-eyebrow"><ShieldAlert className="w-3.5 h-3.5" /> Merchant Decision Queue</div>
          <h1 className="dq-title">Orders Requiring Intervention</h1>
          <p className="dq-sub">Review flagged or medium-risk orders and trigger manual override or shipping dispatch.</p>
        </div>
        <button className="dq-btn-sec" onClick={loadOrders}><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#6b7280", fontSize: 13 }}>Loading decision queue…</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 20px", background: "#fff", border: "1px dashed #d1d5db", borderRadius: 12 }}>
          <CheckCircle2 style={{ width: 40, height: 40, color: "var(--accent, #059669)", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>Decision Queue Clear!</h3>
          <p style={{ fontSize: 13, color: "#6b7280" }}>No orders currently require manual intervention.</p>
        </div>
      ) : (
        orders.map((o) => (
          <div key={o.id} className="dq-card">
            <div className="dq-card-header">
              <div>
                <span className="dq-order-id">Order {o.externalOrderId || o.id.slice(0, 8)}</span>
                <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 10 }}>₹{o.value} (COD)</span>
              </div>
              <span className="dq-badge-held">Action Required</span>
            </div>

            <div className="dq-grid">
              {/* Buyer & Address */}
              <div className="dq-box">
                <div className="dq-box-title"><User className="w-3 h-3 inline mr-1" /> Customer & Delivery Address</div>
                <div style={{ fontWeight: 600 }}>{o.address?.name || "Customer"}</div>
                <div>Phone: {o.phone || o.address?.phone || "N/A"}</div>
                <div style={{ color: "#6b7280", marginTop: 4 }}>
                  <MapPin className="w-3 h-3 inline" /> {o.address?.line1 || "Line 1"}, {o.address?.city || "City"} ({o.address?.pincode || "000000"})
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="dq-box">
                <div className="dq-box-title"><ShieldAlert className="w-3 h-3 inline mr-1" /> Risk Analysis</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: o.riskScore > 70 ? "#dc2626" : "#d97706" }}>
                  Risk Score: {o.riskScore ?? 45}/100
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                  Pincode Zone: Moderate RTO Risk<br />
                  Refusal History: 0 Refusals
                </div>
              </div>

              {/* Courier Recommendation */}
              <div className="dq-box">
                <div className="dq-box-title"><Truck className="w-3 h-3 inline mr-1" /> Recommendations</div>
                <div className="dq-rec-item">
                  <span><span className="dq-rec-rank">#1</span> Shiprocket</span>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>92% success</span>
                </div>
                <div className="dq-rec-item">
                  <span><span style={{ fontWeight: 700 }}>#2</span> Delhivery</span>
                  <span style={{ fontSize: 11, color: "#6b7280" }}>88% success</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="dq-actions">
              <button
                className="dq-btn-sec"
                disabled={actioningId === o.id}
                onClick={() => handleTriggerVerification(o.id)}
              >
                Trigger WhatsApp / Voice Call
              </button>
              <button
                className="dq-btn-pri"
                disabled={actioningId === o.id}
                onClick={() => handleApproveDispatch(o.id, "SHIPROCKET")}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Dispatch (Shiprocket)
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
