"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Network } from "lucide-react";
import { FRAUD_CENTER_EVENTS } from "@/lib/fraud-center-mock";
import {
  formatFullDate,
  formatRelativeTime,
  getInvestigationBadgeClass,
  getSeverityBadgeClass,
  isWithinTimelinePreset,
  type FraudCenterSeverity,
  type FraudCenterStatus,
  type TimelinePreset,
} from "@/lib/fraud-center-ui";

const SEVERITY_OPTIONS: Array<FraudCenterSeverity | "All"> = [
  "All",
  "Low",
  "Medium",
  "High",
  "Critical",
];

const STATUS_OPTIONS: Array<FraudCenterStatus | "All"> = [
  "All",
  "Open",
  "Investigating",
  "Resolved",
  "Dismissed",
];

const TIMELINE_OPTIONS: { value: TimelinePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
];

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 min-w-[140px]">
      <span className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wide">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-9 rounded-lg border border-border-default bg-bg-base px-3 text-xs text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function FraudCenterPage() {
  const [severityFilter, setSeverityFilter] = useState<FraudCenterSeverity | "All">("All");
  const [statusFilter, setStatusFilter] = useState<FraudCenterStatus | "All">("All");
  const [timelineFilter, setTimelineFilter] = useState<TimelinePreset>("all");

  const activeCount = useMemo(
    () =>
      FRAUD_CENTER_EVENTS.filter(
        (e) => e.investigationStatus === "Open" || e.investigationStatus === "Investigating"
      ).length,
    []
  );

  const filteredEvents = useMemo(() => {
    return FRAUD_CENTER_EVENTS.filter((event) => {
      if (severityFilter !== "All" && event.severity !== severityFilter) return false;
      if (statusFilter !== "All" && event.investigationStatus !== statusFilter) return false;
      if (!isWithinTimelinePreset(event.timeline, timelineFilter)) return false;
      return true;
    });
  }, [severityFilter, statusFilter, timelineFilter]);

  const filtersActive =
    severityFilter !== "All" || statusFilter !== "All" || timelineFilter !== "all";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border-default pb-4">
        <div>
          <h1 className="text-xl font-bold text-ink-primary">Fraud Center</h1>
          <p className="text-sm text-ink-secondary mt-1">
            {filtersActive
              ? `${filteredEvents.length} of ${FRAUD_CENTER_EVENTS.length} events`
              : `${activeCount} active events`}
          </p>
        </div>
        <Link
          href="/dashboard/fraud-center/trust-graph"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors shrink-0"
        >
          <Network className="w-3.5 h-3.5" />
          Trust Graph
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end gap-4 p-4 rounded-xl border border-border-default bg-bg-raised">
        <FilterSelect
          label="Severity"
          value={severityFilter}
          options={SEVERITY_OPTIONS}
          onChange={setSeverityFilter}
        />
        <FilterSelect
          label="Investigation Status"
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={setStatusFilter}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wide">
            Timeline
          </span>
          <div className="flex flex-wrap gap-1.5">
            {TIMELINE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTimelineFilter(opt.value)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                  timelineFilter === opt.value
                    ? "bg-accent-muted border-accent/30 text-accent"
                    : "border-border-default text-ink-secondary hover:bg-bg-sunken"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: horizontal scroll (same approach as Dashboard Showcase orders table). */}
      <div className="table-shell bg-bg-base">
        {filteredEvents.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-ink-primary">
              No fraud events match these filters
            </p>
            <p className="text-xs text-ink-secondary mt-1">
              Try broadening severity, status, or timeline filters.
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Severity</th>
                <th>Detected Pattern</th>
                <th>Linked Orders</th>
                <th>Investigation Status</th>
                <th>Timeline</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id}>
                  <td>
                    <span
                      className={`inline-block text-[10px] font-mono font-bold uppercase border px-2 py-0.5 rounded ${getSeverityBadgeClass(event.severity)}`}
                    >
                      {event.severity}
                    </span>
                  </td>
                  <td>
                    <div className="text-xs font-medium text-ink-primary leading-snug">
                      {event.detectedPattern}
                    </div>
                    <div className="text-[10px] text-ink-tertiary mt-0.5 font-mono">
                      {event.city} · {event.pincode}
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      title={event.linkedOrderIds.join(", ")}
                      className="text-xs font-semibold text-accent hover:text-accent/80 px-2 py-0.5 rounded-md border border-accent/25 bg-accent-muted hover:bg-accent-muted/80 transition-colors"
                    >
                      {event.linkedOrderCount}{" "}
                      {event.linkedOrderCount === 1 ? "order" : "orders"}
                    </button>
                  </td>
                  <td>
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${getInvestigationBadgeClass(event.investigationStatus)}`}
                    >
                      {event.investigationStatus}
                    </span>
                  </td>
                  <td>
                    <time
                      dateTime={event.timeline}
                      title={formatFullDate(event.timeline)}
                      className="text-xs text-ink-secondary whitespace-nowrap cursor-default"
                    >
                      {formatRelativeTime(event.timeline)}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
