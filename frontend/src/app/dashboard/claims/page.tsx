"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
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
  Download,
  FileImage,
  FileText,
  File as FileIcon,
  Loader2,
  Search,
} from "lucide-react";
import DashboardModuleShell from "@/components/DashboardModuleShell";
import { fetchClaims, saveClaimNotes, type ClaimRecord } from "@/lib/claims-api";
import {
  CLAIM_STATUS_OPTIONS,
  claimsByStatusChartData,
  claimsValueOverTimeChartData,
  downloadClaimsCsv,
  filterClaims,
  formatClaimCurrency,
  formatFullDate,
  formatRelativeTime,
  getClaimStatusBadgeClass,
  shortOrderId,
  type TimelinePreset,
} from "@/lib/claims-ui";

const TIMELINE_OPTIONS: { value: TimelinePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
];

function DocumentIcon({ fileType }: { fileType: ClaimRecord["documents"][0]["fileType"] }) {
  if (fileType === "pdf") return <FileText className="w-4 h-4 text-negative shrink-0" />;
  if (fileType === "image") return <FileImage className="w-4 h-4 text-accent shrink-0" />;
  return <FileIcon className="w-4 h-4 text-ink-tertiary shrink-0" />;
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof CLAIM_STATUS_OPTIONS)[number]>("All");
  const [timelineFilter, setTimelineFilter] = useState<TimelinePreset>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [saveNotesSuccess, setSaveNotesSuccess] = useState(false);

  const loadClaims = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchClaims();
      if (!data.success || !data.claims) {
        setError(data.message || "Failed to load claims");
        setClaims([]);
        return;
      }
      setClaims(data.claims);
      setSelectedId((prev) => prev ?? data.claims![0]?.id ?? null);
    } catch {
      setError("Network error loading claims");
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  const filteredClaims = useMemo(
    () =>
      filterClaims(claims, {
        status: statusFilter,
        timeline: timelineFilter,
        search,
      }),
    [claims, statusFilter, timelineFilter, search]
  );

  const selectedClaim = useMemo(
    () => filteredClaims.find((c) => c.id === selectedId) ?? filteredClaims[0] ?? null,
    [filteredClaims, selectedId]
  );

  useEffect(() => {
    if (selectedClaim) {
      setEditingNotes(selectedClaim.notes ?? "");
      setSaveNotesSuccess(false);
    } else {
      setEditingNotes("");
    }
  }, [selectedClaim]);

  const statusChartData = useMemo(
    () => claimsByStatusChartData(filteredClaims),
    [filteredClaims]
  );
  const valueChartData = useMemo(
    () => claimsValueOverTimeChartData(filteredClaims),
    [filteredClaims]
  );

  const filtersActive =
    statusFilter !== "All" || timelineFilter !== "all" || search.trim().length > 0;

  return (
    <DashboardModuleShell
      title="Claims"
      description="Track RTO insurance claims, courier disputes, and payout status."
      icon={FileText}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <p className="text-sm text-ink-secondary">
            {loading
              ? "Loading claims…"
              : filtersActive
                ? `${filteredClaims.length} of ${claims.length} claims`
                : `${claims.length} claims`}
          </p>
          <button
            type="button"
            disabled={!filteredClaims.length}
            onClick={() => downloadClaimsCsv(filteredClaims)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border-default bg-bg-base text-xs font-semibold text-ink-primary hover:bg-bg-sunken disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 p-4 rounded-xl border border-border-default bg-bg-raised">
          <label className="flex flex-col gap-1.5 min-w-[140px]">
            <span className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wide">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as (typeof CLAIM_STATUS_OPTIONS)[number])
              }
              className="h-9 rounded-lg border border-border-default bg-bg-base px-3 text-xs text-ink-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
            >
              {CLAIM_STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <span className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wide">
              Search
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Order ID or customer phone"
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-border-default bg-bg-base text-xs text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wide">
              Submitted
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

        {error ? (
          <p className="text-sm text-negative px-1">{error}</p>
        ) : null}

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-bg-raised border border-border-default rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-primary mb-4">
              Claims by status
            </h3>
            <div className="h-52">
              {statusChartData.length === 0 ? (
                <p className="text-xs text-ink-secondary text-center pt-16">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {statusChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
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
              )}
            </div>
          </div>

          <div className="bg-bg-raised border border-border-default rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-primary mb-4">
              Claim value over time
            </h3>
            <div className="h-52">
              {valueChartData.length === 0 ? (
                <p className="text-xs text-ink-secondary text-center pt-16">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={valueChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: "var(--ink-secondary)" }}
                    />
                    <YAxis tick={{ fontSize: 10, fill: "var(--ink-secondary)" }} />
                    <Tooltip
                      formatter={(value) => [
                        formatClaimCurrency(Number(value ?? 0)),
                        "Value",
                      ]}
                      contentStyle={{
                        background: "var(--bg-raised)",
                        border: "1px solid var(--border-default)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-ink-secondary gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading claims…</span>
          </div>
        ) : (
          <>
            <div className="table-shell bg-bg-base">
              {filteredClaims.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <p className="text-sm font-medium text-ink-primary">No claims match these filters</p>
                  <p className="text-xs text-ink-secondary mt-1">
                    Try broadening status, date, or search filters.
                  </p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Phone</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaims.map((claim) => (
                      <tr
                        key={claim.id}
                        onClick={() => setSelectedId(claim.id)}
                        className={`cursor-pointer ${
                          selectedClaim?.id === claim.id ? "bg-accent-muted/40" : ""
                        }`}
                      >
                        <td>
                          <Link
                            href={`/dashboard/orders/${claim.orderId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-mono font-semibold text-accent hover:text-accent/80"
                            title={claim.orderId}
                          >
                            {shortOrderId(claim.orderId)}
                          </Link>
                        </td>
                        <td className="text-xs font-mono text-ink-secondary">{claim.phone}</td>
                        <td className="text-xs font-semibold text-ink-primary whitespace-nowrap">
                          {formatClaimCurrency(claim.amount)}
                        </td>
                        <td>
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${getClaimStatusBadgeClass(claim.status)}`}
                          >
                            {claim.status}
                          </span>
                        </td>
                        <td>
                          <time
                            dateTime={claim.submittedAt}
                            title={formatFullDate(claim.submittedAt)}
                            className="text-xs text-ink-secondary whitespace-nowrap cursor-default"
                          >
                            {formatRelativeTime(claim.submittedAt)}
                          </time>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {selectedClaim ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Documents */}
                <div className="border border-border-default bg-bg-raised rounded-lg p-4 space-y-3">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-primary">
                      Documents
                    </h3>
                    <p className="text-[10px] text-ink-tertiary mt-1">
                      Display-only mock attachments — file upload/storage backend not built yet.
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {selectedClaim.documents.map((doc) => (
                      <li
                        key={doc.filename}
                        className="flex items-start gap-2 p-2 rounded-md border border-border-default bg-bg-base"
                      >
                        <DocumentIcon fileType={doc.fileType} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-ink-primary truncate">
                            {doc.filename}
                          </p>
                          <p className="text-[10px] text-ink-tertiary">
                            {formatFullDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Approval timeline */}
                <div className="border border-border-default bg-bg-raised rounded-lg p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-primary mb-4">
                    Approval timeline
                  </h3>
                  <ol className="space-y-0">
                    {selectedClaim.timeline.map((step, index) => (
                      <li key={step.key} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 ${
                              step.pending
                                ? "border-border-default bg-bg-sunken"
                                : "border-accent bg-accent"
                            }`}
                          />
                          {index < selectedClaim.timeline.length - 1 ? (
                            <span
                              className={`w-px flex-1 min-h-[28px] ${
                                step.pending ? "bg-border-subtle" : "bg-accent/40"
                              }`}
                            />
                          ) : null}
                        </div>
                        <div className="pb-4 min-w-0">
                          <p
                            className={`text-xs font-semibold ${
                              step.pending ? "text-ink-tertiary" : "text-ink-primary"
                            }`}
                          >
                            {step.label}
                          </p>
                          {step.occurredAt ? (
                            <time
                              dateTime={step.occurredAt}
                              className="text-[10px] text-ink-secondary"
                            >
                              {formatFullDate(step.occurredAt)}
                            </time>
                          ) : (
                            <p className="text-[10px] text-ink-tertiary">Pending</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Merchant notes */}
                <div className="border border-border-default bg-bg-raised rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-primary">
                        Merchant notes
                      </h3>
                      <p className="text-[10px] text-ink-tertiary mt-1">
                        Saved directly to Postgres and persisted.
                      </p>
                    </div>
                    {saveNotesSuccess && (
                      <span className="text-[10px] text-positive font-semibold">Saved!</span>
                    )}
                  </div>
                  <textarea
                    rows={5}
                    value={editingNotes}
                    onChange={(e) => {
                      setEditingNotes(e.target.value);
                      setSaveNotesSuccess(false);
                    }}
                    placeholder="Enter notes/comments for this claim..."
                    className="w-full rounded-lg border border-border-default bg-bg-base px-3 py-2 text-xs text-ink-primary resize-none focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                  />
                  <button
                    type="button"
                    disabled={savingNotes || editingNotes === (selectedClaim?.notes ?? "")}
                    onClick={async () => {
                      if (!selectedClaim) return;
                      setSavingNotes(true);
                      try {
                        const res = await saveClaimNotes(selectedClaim.id, editingNotes);
                        if (res.success) {
                          setSaveNotesSuccess(true);
                          setClaims((prevClaims) =>
                            prevClaims.map((c) =>
                              c.id === selectedClaim.id ? { ...c, notes: editingNotes } : c
                            )
                          );
                        } else {
                          alert(res.message || "Failed to save notes");
                        }
                      } catch {
                        alert("Network error saving notes");
                      } finally {
                        setSavingNotes(false);
                      }
                    }}
                    className="w-full h-8 px-3 rounded-lg bg-accent text-xs font-semibold text-white hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingNotes ? "Saving..." : "Save Notes"}
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </DashboardModuleShell>
  );
}
