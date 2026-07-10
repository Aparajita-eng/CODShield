"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchPincodeDetail } from "@/lib/pincode-api";
import type { PincodeMetrics } from "@/lib/pincode-api";
import { formatCurrency, CHART_COLORS } from "@/lib/dashboard-ui";
import { getRiskBadgeClass } from "@/lib/pincode-ui";

interface PincodeDetailDrawerProps {
  pincode: PincodeMetrics | null;
  startDate: string;
  endDate: string;
  onClose: () => void;
}

export default function PincodeDetailDrawer({
  pincode,
  startDate,
  endDate,
  onClose,
}: PincodeDetailDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [trend, setTrend] = useState<{ month: string; orders: number; rtoRate: number; fraudRate: number }[]>([]);
  const [recentOrders, setRecentOrders] = useState<
    {
      id: string;
      date: string;
      value: number;
      status: string;
      riskScore: number;
      riskLevel: string;
    }[]
  >([]);

  useEffect(() => {
    if (!pincode) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const result = await fetchPincodeDetail(pincode.pincode, { startDate, endDate });
        if (!active) return;
        if (result.success) {
          setTrend(result.monthlyTrend || []);
          setRecentOrders(result.recentOrders || []);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [pincode, startDate, endDate]);

  const chartData = trend.map((t) => ({
    ...t,
    label: t.month.slice(5) + "/" + t.month.slice(2, 4),
  }));

  return (
    <AnimatePresence>
      {pincode && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.22 }}
            className="fixed top-0 right-0 bottom-0 w-[min(100%,420px)] z-50 bg-bg-raised border-l border-border-default shadow-xl overflow-y-auto"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 border-b border-border-default bg-bg-raised">
              <div>
                <p className="text-xs text-ink-tertiary uppercase tracking-wide">Pincode detail</p>
                <p className="text-lg font-mono font-bold text-ink-primary">{pincode.pincode}</p>
              </div>
              <button type="button" onClick={onClose} className="text-ink-tertiary hover:text-ink-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              <div>
                <p className="text-sm text-ink-secondary">
                  {pincode.city !== "Unknown area" ? pincode.city : pincode.district}, {pincode.state}
                </p>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="rounded-lg border border-border-default p-3">
                    <p className="text-[10px] uppercase text-ink-tertiary">Risk</p>
                    <p className="text-xl font-mono font-bold text-ink-primary mt-1">{pincode.riskScore}</p>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getRiskBadgeClass(pincode.riskLevel)}`}
                    >
                      {pincode.riskLevel}
                    </span>
                  </div>
                  <div className="rounded-lg border border-border-default p-3">
                    <p className="text-[10px] uppercase text-ink-tertiary">Success</p>
                    <p className="text-xl font-mono font-bold text-ink-primary mt-1">{pincode.successPct}%</p>
                  </div>
                  <div className="rounded-lg border border-border-default p-3">
                    <p className="text-[10px] uppercase text-ink-tertiary">Fraud</p>
                    <p className="text-xl font-mono font-bold text-ink-primary mt-1">{pincode.fraudPct}%</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-primary mb-3">
                  Trend over time
                </h4>
                {loading ? (
                  <p className="text-sm text-ink-secondary">Loading trend…</p>
                ) : chartData.length === 0 ? (
                  <p className="text-sm text-ink-secondary">No trend data for this period.</p>
                ) : (
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--ink-secondary)" }} />
                        <YAxis tick={{ fontSize: 10, fill: "var(--ink-secondary)" }} />
                        <Tooltip
                          contentStyle={{
                            background: "var(--bg-raised)",
                            border: "1px solid var(--border-default)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Bar dataKey="orders" fill={CHART_COLORS.accent} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-primary mb-3">
                  Recent orders
                </h4>
                {loading ? (
                  <p className="text-sm text-ink-secondary">Loading orders…</p>
                ) : recentOrders.length === 0 ? (
                  <p className="text-sm text-ink-secondary">No recent orders.</p>
                ) : (
                  <ul className="space-y-2">
                    {recentOrders.map((order) => (
                      <li key={order.id}>
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border-default hover:bg-bg-sunken transition-colors"
                        >
                          <div>
                            <p className="text-xs font-mono text-ink-primary">{order.id.slice(0, 8)}…</p>
                            <p className="text-[10px] text-ink-tertiary mt-0.5">
                              {new Date(order.date).toLocaleDateString("en-IN")} · {order.status}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-mono text-ink-secondary">
                              {formatCurrency(order.value)}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 text-ink-tertiary" />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
