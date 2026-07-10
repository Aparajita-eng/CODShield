"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { CHART_COLORS } from "@/lib/dashboard-ui";

interface PincodeChartsProps {
  riskDistribution: { band: string; count: number }[];
  scatterData: {
    pincode: string;
    area: string;
    orderCount: number;
    fraudPct: number;
    riskScore: number;
    riskLevel: string;
  }[];
}

const BAND_COLORS: Record<string, string> = {
  Low: CHART_COLORS.positive,
  Medium: CHART_COLORS.warning,
  High: CHART_COLORS.negative,
};

export default function PincodeCharts({ riskDistribution, scatterData }: PincodeChartsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="bg-bg-raised border border-border-default rounded-lg p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-primary mb-4">
          Risk distribution
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskDistribution} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="band" tick={{ fontSize: 11, fill: "var(--ink-secondary)" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--ink-secondary)" }} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-raised)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {riskDistribution.map((entry) => (
                  <Cell key={entry.band} fill={BAND_COLORS[entry.band] || CHART_COLORS.inkSecondary} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-bg-raised border border-border-default rounded-lg p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-primary mb-1">
          Fraud % vs order volume
        </h3>
        <p className="text-[10px] text-ink-tertiary mb-3">
          Upper-right = high fraud and high volume (priority review)
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis
                type="number"
                dataKey="orderCount"
                name="Orders"
                tick={{ fontSize: 11, fill: "var(--ink-secondary)" }}
              />
              <YAxis
                type="number"
                dataKey="fraudPct"
                name="Fraud %"
                unit="%"
                tick={{ fontSize: 11, fill: "var(--ink-secondary)" }}
              />
              <ZAxis type="number" dataKey="riskScore" range={[60, 260]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as (typeof scatterData)[number];
                  return (
                    <div className="rounded-lg border border-border-default bg-bg-raised px-3 py-2 text-xs shadow-sm">
                      <p className="font-semibold text-ink-primary">{d.pincode}</p>
                      <p className="text-ink-secondary">{d.area}</p>
                      <p>Orders: {d.orderCount}</p>
                      <p>Fraud: {d.fraudPct}%</p>
                      <p>Risk: {d.riskScore}</p>
                    </div>
                  );
                }}
              />
              <Scatter data={scatterData} fill={CHART_COLORS.accent}>
                {scatterData.map((entry) => (
                  <Cell
                    key={entry.pincode}
                    fill={BAND_COLORS[entry.riskLevel] || CHART_COLORS.inkSecondary}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
