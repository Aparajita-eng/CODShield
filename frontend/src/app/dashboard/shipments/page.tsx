"use client";

import React, { useState, useEffect } from "react";
import { Truck, ExternalLink, RefreshCw, CheckCircle2, Clock, Package } from "lucide-react";

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadShipments = async () => {
    try {
      const res = await fetch("/api/shipments");
      const data = await res.json();
      if (data.success) {
        setShipments(data.shipments || []);
      }
    } catch {
      console.error("Failed to load shipments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, []);

  return (
    <div style={{ padding: 32, maxWidth: 1040, margin: "0 auto" }}>
      <style>{`
        .sh-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .sh-eyebrow { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: var(--accent, #059669); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .sh-title { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 4px; }
        .sh-sub { font-size: 13px; color: #6b7280; margin: 0; }

        .sh-table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
        .sh-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
        .sh-table td { padding: 14px 16px; font-size: 13px; color: #111827; border-bottom: 1px solid #f3f4f6; }
        .sh-badge { padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: rgba(5,150,105,0.1); color: var(--accent, #059669); }
      `}</style>

      <div className="sh-header">
        <div>
          <div className="sh-eyebrow"><Truck className="w-3.5 h-3.5" /> Shipment Dispatch & Tracking</div>
          <h1 className="sh-title">Active Shipments</h1>
          <p className="sh-sub">Track real-time delivery status, courier waybills, and shipping labels.</p>
        </div>
        <button
          onClick={loadShipments}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#6b7280", fontSize: 13 }}>Loading shipments…</div>
      ) : shipments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 20px", background: "#fff", border: "1px dashed #d1d5db", borderRadius: 12 }}>
          <Package style={{ width: 40, height: 40, color: "var(--accent, #059669)", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>No Dispatched Shipments Yet</h3>
          <p style={{ fontSize: 13, color: "#6b7280" }}>Approved orders in the decision queue will generate waybills and shipping labels here.</p>
        </div>
      ) : (
        <table className="sh-table">
          <thead>
            <tr>
              <th>Tracking ID</th>
              <th>Order ID</th>
              <th>Courier Partner</th>
              <th>Status</th>
              <th>Label</th>
              <th>Dispatched Date</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id}>
                <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{s.trackingId || "PENDING"}</td>
                <td>{s.order?.externalOrderId || s.orderId?.slice(0, 8)}</td>
                <td style={{ fontWeight: 600 }}>{s.courier}</td>
                <td><span className="sh-badge">{s.status}</span></td>
                <td>
                  {s.labelUrl ? (
                    <a href={s.labelUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent, #059669)", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      Label <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : "N/A"}
                </td>
                <td style={{ color: "#6b7280", fontSize: 12 }}>{new Date(s.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
