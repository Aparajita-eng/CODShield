"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  ShieldAlert,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Search,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { useMediaQuery, useDebouncedValue } from "@/lib/hooks";
import {
  fetchFraudEvents,
  type FraudEvent,
  type FraudSeverity,
  type InvestigationStatus,
} from "@/lib/fraud-events-api";
import { formatDate, formatCurrency, getRiskColor } from "@/lib/dashboard-ui";

const SEVERITY_OPTIONS: FraudSeverity[] = ["Low", "Medium", "High"];
const STATUS_OPTIONS: InvestigationStatus[] = [
  "Open",
  "Under Review",
  "Confirmed",
  "Resolved",
  "Monitoring",
];

function severityBadgeClass(level: FraudSeverity) {
  switch (level) {
    case "High":
      return "text-negative bg-negative/8 border-negative/20";
    case "Medium":
      return "text-warning bg-warning/8 border-warning/20";
    case "Low":
      return "text-positive bg-positive/8 border-positive/20";
    default:
      return "text-ink-secondary bg-bg-sunken border-border-default";
  }
}

function statusBadgeClass(status: InvestigationStatus) {
  switch (status) {
    case "Open":
      return "text-negative bg-negative/8 border-negative/20";
    case "Under Review":
      return "text-warning bg-warning/8 border-warning/20";
    case "Confirmed":
      return "text-negative bg-negative/12 border-negative/30";
    case "Resolved":
      return "text-ink-secondary bg-bg-sunken border-border-default";
    case "Monitoring":
      return "text-accent bg-accent-muted border-accent/20";
    default:
      return "text-ink-secondary bg-bg-sunken border-border-default";
  }
}

function FilterPanel({
  severities,
  toggleSeverity,
  statuses,
  toggleStatus,
  patternCategory,
  setPatternCategory,
  patternCategories,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  onApply,
  loading,
}: {
  severities: FraudSeverity[];
  toggleSeverity: (s: FraudSeverity) => void;
  statuses: InvestigationStatus[];
  toggleStatus: (s: InvestigationStatus) => void;
  patternCategory: string;
  setPatternCategory: (v: string) => void;
  patternCategories: string[];
  startDate: string;
  endDate: string;
  setStartDate: (v: string) => void;
  setEndDate: (v: string) => void;
  onApply: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-ink-primary uppercase tracking-wide">
          Severity
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {SEVERITY_OPTIONS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => toggleSeverity(level)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                severities.includes(level)
                  ? "bg-accent-muted border-accent/30 text-accent"
                  : "border-border-default text-ink-secondary hover:bg-bg-sunken"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-primary uppercase tracking-wide">
          Investigation status
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => toggleStatus(status)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                statuses.includes(status)
                  ? "bg-accent-muted border-accent/30 text-accent"
                  : "border-border-default text-ink-secondary hover:bg-bg-sunken"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-primary uppercase tracking-wide">
          Pattern type
        </label>
        <select
          value={patternCategory}
          onChange={(e) => setPatternCategory(e.target.value)}
          className="mt-1.5 w-full px-3 py-2 rounded-lg border border-border-default bg-bg-base text-sm text-ink-primary"
        >
          <option value="">All patterns</option>
          {patternCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-ink-primary uppercase tracking-wide">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1.5 w-full px-2 py-2 rounded-lg border border-border-default bg-bg-base text-xs"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-primary uppercase tracking-wide">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1.5 w-full px-2 py-2 rounded-lg border border-border-default bg-bg-base text-xs"
          />
        </div>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={onApply}
        className="w-full py-2.5 rounded-lg bg-accent text-ink-inverse text-sm font-semibold hover:bg-accent/90 disabled:opacity-50"
      >
        {loading ? "Loading…" : "Apply filters"}
      </button>
    </div>
  );
}

export default function FraudEventsPage() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<FraudEvent[]>([]);
  const [patternCategories, setPatternCategories] = useState<string[]>([]);
  const [summary, setSummary] = useState({ open: 0, high: 0, confirmed: 0 });
  const [sorting, setSorting] = useState<SortingState>([{ id: "timeline", desc: true }]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FraudEvent | null>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [severities, setSeverities] = useState<FraudSeverity[]>([...SEVERITY_OPTIONS]);
  const [statuses, setStatuses] = useState<InvestigationStatus[]>([...STATUS_OPTIONS]);
  const [patternCategory, setPatternCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [applied, setApplied] = useState({
    severities: [...SEVERITY_OPTIONS] as FraudSeverity[],
    statuses: [...STATUS_OPTIONS] as InvestigationStatus[],
    patternCategory: "",
    startDate: "",
    endDate: "",
  });

  const loadEvents = useCallback(async (filters = applied, searchQuery = debouncedSearch) => {
    setLoading(true);
    setError("");
    try {
      const severityParam =
        filters.severities.length > 0 && filters.severities.length < SEVERITY_OPTIONS.length
          ? filters.severities
          : undefined;
      const statusParam =
        filters.statuses.length > 0 && filters.statuses.length < STATUS_OPTIONS.length
          ? filters.statuses
          : undefined;

      const result = await fetchFraudEvents({
        severities: severityParam,
        statuses: statusParam,
        patternCategory: filters.patternCategory || undefined,
        search: searchQuery || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });

      if (!result.success) {
        setError(result.message || "Failed to load fraud events");
        setEvents([]);
        return;
      }

      setEvents(result.events);
      setPatternCategories(result.patternCategories);
      setSummary(result.summary);
    } catch {
      setError("Failed to load fraud events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [applied, debouncedSearch]);

  useEffect(() => {
    void loadEvents(applied, debouncedSearch);
  }, [applied, debouncedSearch, loadEvents]);

  const toggleSeverity = (level: FraudSeverity) => {
    setSeverities((prev) => {
      const next = prev.includes(level) ? prev.filter((s) => s !== level) : [...prev, level];
      return next.length ? next : [...SEVERITY_OPTIONS];
    });
  };

  const toggleStatus = (status: InvestigationStatus) => {
    setStatuses((prev) => {
      const next = prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status];
      return next.length ? next : [...STATUS_OPTIONS];
    });
  };

  const handleApply = () => {
    setApplied({
      severities: [...severities],
      statuses: [...statuses],
      patternCategory,
      startDate,
      endDate,
    });
    if (!isDesktop) setFilterOpen(false);
  };

  const columns = useMemo<ColumnDef<FraudEvent>[]>(
    () => [
      {
        accessorKey: "severity",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 text-xs font-semibold text-ink-tertiary uppercase"
          >
            Severity
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${severityBadgeClass(row.original.severity)}`}
          >
            {row.original.severity}
          </span>
        ),
      },
      {
        accessorKey: "timeline",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 text-xs font-semibold text-ink-tertiary uppercase"
          >
            Timeline
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-ink-secondary whitespace-nowrap">
            {formatDate(row.original.timeline)}
          </span>
        ),
      },
      {
        accessorKey: "detectedPattern",
        header: "Detected Pattern",
        cell: ({ row }) => (
          <div className="min-w-[200px] max-w-md">
            <p className="text-xs text-ink-primary leading-relaxed">{row.original.detectedPattern}</p>
            <p className="text-[10px] text-ink-tertiary mt-0.5">{row.original.patternCategory}</p>
          </div>
        ),
      },
      {
        id: "linkedOrders",
        header: "Linked Orders",
        cell: ({ row }) => {
          const orders = row.original.linkedOrders;
          const first = orders[0];
          return (
            <div className="text-xs">
              <p className="font-mono text-ink-primary">
                {orders.length} order{orders.length === 1 ? "" : "s"}
                {row.original.linkedPhoneCount > 1 && (
                  <span className="text-ink-tertiary"> · {row.original.linkedPhoneCount} phones</span>
                )}
              </p>
              {first && (
                <Link
                  href={`/dashboard/orders/${first.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-accent hover:text-accent/80 mt-0.5"
                >
                  {first.id.slice(0, 8)}…
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "investigationStatus",
        header: "Investigation Status",
        cell: ({ row }) => (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${statusBadgeClass(row.original.investigationStatus)}`}
          >
            {row.original.investigationStatus}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: events,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-4">
      <nav className="text-xs text-ink-tertiary">
        <Link href="/dashboard" className="hover:text-accent transition-colors">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <Link href="/dashboard/fraud-center" className="hover:text-accent transition-colors">
          Fraud Center
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-secondary">Fraud Events</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-default pb-4">
        <div className="flex items-start gap-3">
          <Link
            href="/dashboard/fraud-center"
            className="mt-1 text-ink-tertiary hover:text-ink-primary"
            aria-label="Back to Fraud Center"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-lg border border-accent/20 bg-accent-muted flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink-primary">Fraud Events</h1>
            <p className="text-sm text-ink-secondary mt-0.5">
              Detected patterns, linked orders, and investigation status across your COD network.
            </p>
          </div>
        </div>
        {!isDesktop && (
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-default bg-bg-raised text-sm font-semibold text-ink-primary"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border-default bg-bg-raised px-4 py-3">
          <p className="text-2xl font-bold font-mono text-ink-primary">{summary.open}</p>
          <p className="text-xs text-ink-secondary mt-1">Open investigations</p>
        </div>
        <div className="rounded-lg border border-border-default bg-bg-raised px-4 py-3">
          <p className="text-2xl font-bold font-mono text-negative">{summary.high}</p>
          <p className="text-xs text-ink-secondary mt-1">High severity events</p>
        </div>
        <div className="rounded-lg border border-border-default bg-bg-raised px-4 py-3">
          <p className="text-2xl font-bold font-mono text-ink-primary">{summary.confirmed}</p>
          <p className="text-xs text-ink-secondary mt-1">Confirmed fraud</p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-negative border border-negative/20 bg-negative/5 rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {isDesktop && (
          <aside className="w-64 shrink-0 border border-border-default rounded-lg bg-bg-raised p-4 h-fit">
            <h2 className="text-xs font-semibold text-ink-primary uppercase tracking-wide mb-4 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" />
              Filters
            </h2>
            <FilterPanel
              severities={severities}
              toggleSeverity={toggleSeverity}
              statuses={statuses}
              toggleStatus={toggleStatus}
              patternCategory={patternCategory}
              setPatternCategory={setPatternCategory}
              patternCategories={patternCategories}
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              onApply={handleApply}
              loading={loading}
            />
          </aside>
        )}

        <div className="flex-1 min-w-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patterns, order IDs, phones, pincodes…"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-default bg-bg-raised text-sm text-ink-primary"
            />
          </div>

          <div className="bg-bg-raised border border-border-default rounded-lg overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-sm text-ink-secondary">Loading fraud events…</div>
            ) : events.length === 0 ? (
              <div className="py-16 text-center">
                <ShieldAlert className="w-8 h-8 text-ink-tertiary mx-auto mb-3" />
                <p className="text-sm font-semibold text-ink-primary">No fraud events match your filters</p>
                <p className="text-sm text-ink-secondary mt-1">Try widening the date range or clearing filters.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      {table.getHeaderGroups().map((hg) => (
                        <tr key={hg.id} className="border-b border-border-default bg-bg-base">
                          {hg.headers.map((header) => (
                            <th key={header.id} className="px-4 py-3 text-left">
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedEvent(row.original)}
                          className="border-b border-border-subtle hover:bg-bg-sunken cursor-pointer transition-colors"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-4 py-3 align-top">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-border-default flex items-center justify-between text-xs text-ink-secondary">
                  <span>
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!table.getCanPreviousPage()}
                      onClick={() => table.previousPage()}
                      className="p-1.5 rounded border border-border-default disabled:opacity-40 hover:bg-bg-sunken"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={!table.getCanNextPage()}
                      onClick={() => table.nextPage()}
                      className="p-1.5 rounded border border-border-default disabled:opacity-40 hover:bg-bg-sunken"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSelectedEvent(null)}
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
                  <p className="text-xs text-ink-tertiary uppercase tracking-wide">Event detail</p>
                  <p className="text-sm font-semibold text-ink-primary mt-0.5">{selectedEvent.patternCategory}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="text-ink-tertiary hover:text-ink-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-5">
                <p className="text-sm text-ink-primary leading-relaxed">{selectedEvent.detectedPattern}</p>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${severityBadgeClass(selectedEvent.severity)}`}
                  >
                    {selectedEvent.severity}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusBadgeClass(selectedEvent.investigationStatus)}`}
                  >
                    {selectedEvent.investigationStatus}
                  </span>
                  <span className="text-[10px] text-ink-tertiary px-2 py-0.5">
                    {formatDate(selectedEvent.timeline)}
                  </span>
                </div>
                {selectedEvent.clusterId && (
                  <Link
                    href={`/dashboard/fraud-center/trust-graph?phone=${selectedEvent.linkedOrders[0]?.phone || ""}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent/80"
                  >
                    View in Trust Graph
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-primary mb-3">
                    Linked orders ({selectedEvent.linkedOrders.length})
                  </h4>
                  <ul className="space-y-2">
                    {selectedEvent.linkedOrders.map((order) => (
                      <li key={order.id}>
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border-default hover:bg-bg-sunken transition-colors"
                        >
                          <div>
                            <p className="text-xs font-mono text-ink-primary">{order.id.slice(0, 12)}…</p>
                            <p className="text-[10px] text-ink-tertiary mt-0.5">
                              {order.phone} · {order.pincode} · {order.status}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-mono text-ink-secondary">{formatCurrency(order.value)}</p>
                            <p
                              className="text-[10px] font-semibold mt-0.5"
                              style={{ color: getRiskColor(order.riskScore <= 30 ? "Low" : order.riskScore <= 70 ? "Medium" : "High") }}
                            >
                              Risk {order.riskScore}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isDesktop && filterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setFilterOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.22 }}
              className="fixed top-0 right-0 bottom-0 w-[min(100%,320px)] z-50 bg-bg-raised border-l border-border-default p-4 overflow-y-auto shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-ink-primary">Filters</h2>
                <button type="button" onClick={() => setFilterOpen(false)} className="text-ink-tertiary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterPanel
                severities={severities}
                toggleSeverity={toggleSeverity}
                statuses={statuses}
                toggleStatus={toggleStatus}
                patternCategory={patternCategory}
                setPatternCategory={setPatternCategory}
                patternCategories={patternCategories}
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                onApply={handleApply}
                loading={loading}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
