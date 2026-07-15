"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Download,
  HelpCircle,
  Loader2,
  Percent,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import DashboardModuleShell from "@/components/DashboardModuleShell";
import { fetchAnalytics, type AnalyticsResponse } from "@/lib/analytics-api";

type TimelinePreset = "today" | "7d" | "30d" | "90d" | "all";

const TIMELINE_OPTIONS: { value: TimelinePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [timeline, setTimeline] = useState<TimelinePreset>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const res = await fetchAnalytics(timeline);
        if (res.success) {
          setData(res);
        } else {
          setError(res.message || "Failed to fetch analytics data");
        }
      } catch {
        setError("Network error fetching analytics");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [timeline]);

  const handleExportCsv = () => {
    if (!data?.orders || data.orders.length === 0) return;

    const headers = [
      "Order ID",
      "Created At",
      "Phone",
      "Pincode",
      "Value (INR)",
      "Risk Score",
      "Protection Status",
      "Fulfillment Status",
      "Fraud Flagged",
      "Status Reason",
    ];

    const escapeCsvCell = (val: string | number | boolean) => {
      const str = String(val);
      if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };

    const rows = data.orders.map((o) =>
      [
        o.id,
        o.createdAt,
        o.phone,
        o.pincode,
        o.value,
        o.riskScore,
        o.protectionStatus,
        o.fulfillmentStatus,
        o.fraudFlagged,
        o.statusReason,
      ]
        .map(escapeCsvCell)
        .join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-export-${timeline}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const metrics = data?.metrics;
  const charts = data?.charts;

  return (
    <DashboardModuleShell
      title="Analytics"
      description="Review verification pass rates, estimated savings, and category risk breakdowns."
      icon={BarChart3}
    >
      <div className="space-y-6">
        {/* Date Filter & Export Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wide">
              Timeline Range
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TIMELINE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTimeline(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    timeline === opt.value
                      ? "bg-accent-muted border-accent/30 text-accent"
                      : "border-border-default text-ink-secondary hover:bg-bg-sunken bg-bg-raised"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={loading || !data?.orders?.length}
            onClick={handleExportCsv}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-border-default bg-bg-raised text-xs font-semibold text-ink-primary hover:bg-bg-sunken disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-end sm:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>

        {error ? (
          <div className="p-4 rounded-lg bg-negative/5 border border-negative/20 text-xs text-negative font-medium">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-32 text-ink-secondary gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
            <span className="text-sm font-medium">Computing analytics data…</span>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Blocked Fraud */}
              <div className="border border-border-default bg-bg-raised rounded-xl p-4 flex flex-col justify-between min-h-[105px]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-ink-tertiary uppercase tracking-wide">
                    Blocked Fraud
                  </span>
                  <ShieldAlert className="w-4 h-4 text-negative" />
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-ink-primary leading-none">
                    {metrics?.blockedFraudCount ?? 0}
                  </p>
                  <p className="text-[9px] text-ink-tertiary mt-1">
                    Orders auto-blocked as fraud in this period.
                  </p>
                </div>
              </div>

              {/* Money Saved */}
              <div
                onMouseEnter={() => setHoveredCard("money")}
                onMouseLeave={() => setHoveredCard(null)}
                className="relative border border-border-default bg-bg-raised rounded-xl p-4 flex flex-col justify-between min-h-[105px]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-ink-tertiary uppercase tracking-wide">
                    Money Saved
                    <HelpCircle className="w-3 h-3 text-ink-tertiary cursor-pointer" />
                  </span>
                  <ShieldCheck className="w-4 h-4 text-positive" />
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-ink-primary leading-none">
                    {formatCurrency(metrics?.moneySaved ?? 0)}
                  </p>
                  <p className="text-[9px] text-ink-tertiary mt-1">
                    Estimated loss avoided from blocked fraud specifically.
                  </p>
                </div>

                {hoveredCard === "money" && (
                  <div className="absolute z-10 bottom-full left-0 mb-2 w-56 p-2 rounded-lg bg-bg-base border border-border-default shadow-lg text-[10px] text-ink-secondary leading-normal">
                    <strong>Money Saved Formula:</strong>
                    <br />
                    Sum of order values where fraud was flagged and successfully blocked.
                  </div>
                )}
              </div>

              {/* Revenue Saved */}
              <div
                onMouseEnter={() => setHoveredCard("revenue")}
                onMouseLeave={() => setHoveredCard(null)}
                className="relative border border-border-default bg-bg-raised rounded-xl p-4 flex flex-col justify-between min-h-[105px]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-ink-tertiary uppercase tracking-wide">
                    Revenue Saved
                    <HelpCircle className="w-3 h-3 text-ink-tertiary cursor-pointer" />
                  </span>
                  <TrendingUp className="w-4 h-4 text-accent" />
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-ink-primary leading-none">
                    {formatCurrency(metrics?.revenueSaved ?? 0)}
                  </p>
                  <p className="text-[9px] text-ink-tertiary mt-1">
                    Total order value protected via OTP/risk verification broadly.
                  </p>
                </div>

                {hoveredCard === "revenue" && (
                  <div className="absolute z-10 bottom-full left-0 mb-2 w-56 p-2 rounded-lg bg-bg-base border border-border-default shadow-lg text-[10px] text-ink-secondary leading-normal">
                    <strong>Revenue Saved Formula:</strong>
                    <br />
                    Sum of order values where protection status is marked as Protected.
                  </div>
                )}
              </div>

              {/* OTP Success */}
              <div className="border border-border-default bg-bg-raised rounded-xl p-4 flex flex-col justify-between min-h-[105px]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-ink-tertiary uppercase tracking-wide">
                    OTP Success Rate
                  </span>
                  <Percent className="w-4 h-4 text-warning" />
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-ink-primary leading-none">
                    {metrics?.otpSuccessRate ?? 0}%
                  </p>
                  <p className="text-[9px] text-ink-tertiary mt-1">
                    Pass rate of orders placed on hold for OTP check.
                  </p>
                </div>
              </div>

              {/* RTO Reduction */}
              <div className="border border-border-default bg-bg-raised rounded-xl p-4 flex flex-col justify-between min-h-[105px]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-ink-tertiary uppercase tracking-wide">
                    RTO Reduction
                  </span>
                  {(metrics?.rtoReduction ?? 0) >= 0 ? (
                    <TrendingDown className="w-4 h-4 text-positive" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-negative" />
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-ink-primary leading-none">
                    {(metrics?.rtoReduction ?? 0) >= 0 ? "+" : ""}
                    {metrics?.rtoReduction ?? 0}%
                  </p>
                </div>
                <p className="text-[9px] text-ink-tertiary mt-1">
                  Current rate ({metrics?.currentRtoRate ?? 0}%) vs prior baseline ({metrics?.priorRtoRate ?? 0}%).
                </p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fraud Trends Line/Area */}
              <div className="border border-border-default bg-bg-raised rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-ink-primary">
                    Fraud Trends
                  </h3>
                  <p className="text-[10px] text-ink-tertiary mt-1">
                    Count of blocked fraud events over time (Line Chart).
                  </p>
                </div>
                <div className="h-64">
                  {charts?.fraudTrends?.length === 0 ? (
                    <p className="text-xs text-ink-secondary text-center pt-28">No trends data available</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={charts?.fraudTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--negative)" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="var(--negative)" stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--ink-secondary)" }} />
                        <YAxis tick={{ fontSize: 10, fill: "var(--ink-secondary)" }} />
                        <Tooltip
                          contentStyle={{
                            background: "var(--bg-raised)",
                            border: "1px solid var(--border-default)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Area type="monotone" dataKey="count" name="Fraud Attempts" stroke="var(--negative)" fillOpacity={1} fill="url(#colorFraud)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Revenue Saved Bar */}
              <div className="border border-border-default bg-bg-raised rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-ink-primary">
                    Revenue Protected
                  </h3>
                  <p className="text-[10px] text-ink-tertiary mt-1">
                    Protected order value sum over time (Bar Chart).
                  </p>
                </div>
                <div className="h-64">
                  {charts?.revenueSavedTrends?.length === 0 ? (
                    <p className="text-xs text-ink-secondary text-center pt-28">No revenue trends data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts?.revenueSavedTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--ink-secondary)" }} />
                        <YAxis tick={{ fontSize: 10, fill: "var(--ink-secondary)" }} tickFormatter={(v) => `₹${v/1000}k`} />
                        <Tooltip
                          formatter={(v) => [formatCurrency(Number(v)), "Revenue Saved"]}
                          contentStyle={{
                            background: "var(--bg-raised)",
                            border: "1px solid var(--border-default)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Bar dataKey="amount" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Fraud Categories Pie */}
              <div className="border border-border-default bg-bg-raised rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-ink-primary">
                    Fraud Category Breakdown
                  </h3>
                  <p className="text-[10px] text-ink-tertiary mt-1">
                    Distribution of auto-blocks by category check failure (Pie Chart).
                  </p>
                </div>
                <div className="h-64 flex flex-col sm:flex-row items-center justify-around">
                  {charts?.fraudCategories?.length === 0 ? (
                    <p className="text-xs text-ink-secondary text-center pt-28">No category blocks available</p>
                  ) : (
                    <>
                      <div className="w-48 h-48 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={charts?.fraudCategories}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={36}
                              outerRadius={64}
                              paddingAngle={2}
                            >
                              {charts?.fraudCategories.map((entry, idx) => {
                                const colors = ["var(--negative)", "var(--warning)", "var(--accent)", "var(--ink-secondary)", "var(--positive)"];
                                return <Cell key={entry.name} fill={colors[idx % colors.length]} />;
                              })}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: "var(--bg-raised)",
                                border: "1px solid var(--border-default)",
                                borderRadius: 8,
                                fontSize: 12,
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-2 mt-4 sm:mt-0 text-xs">
                        {charts?.fraudCategories.map((entry, idx) => {
                          const colors = ["var(--negative)", "var(--warning)", "var(--accent)", "var(--ink-secondary)", "var(--positive)"];
                          return (
                            <div key={entry.name} className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                              <span className="text-ink-secondary font-medium">{entry.name}</span>
                              <span className="text-ink-primary font-bold">({entry.value})</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Orders by Risk Level Bar */}
              <div className="border border-border-default bg-bg-raised rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-ink-primary">
                    Orders by Risk Level
                  </h3>
                  <p className="text-[10px] text-ink-tertiary mt-1">
                    Volume distribution of orders in this period (Bar Chart).
                  </p>
                </div>
                <div className="h-64">
                  {charts?.riskLevels?.length === 0 ? (
                    <p className="text-xs text-ink-secondary text-center pt-28">No risk levels data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts?.riskLevels} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--ink-secondary)" }} />
                        <YAxis tick={{ fontSize: 10, fill: "var(--ink-secondary)" }} />
                        <Tooltip
                          contentStyle={{
                            background: "var(--bg-raised)",
                            border: "1px solid var(--border-default)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Bar dataKey="value" name="Order count" radius={[4, 4, 0, 0]}>
                          {charts?.riskLevels.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
    </div>
    </DashboardModuleShell>
  );
}
