"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network,
  Filter,
  X,
  ChevronLeft,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useMediaQuery } from "@/lib/hooks";
import {
  fetchTrustGraph,
  type GraphNodeType,
  type GraphRiskLevel,
  type TrustGraphApiEdge,
  type TrustGraphApiNode,
  type TrustGraphNodeData,
} from "@/lib/trust-graph-api";
import TrustGraphCanvas from "@/components/trust-graph/TrustGraphCanvas";
import { getRiskColor, maskPhone } from "@/lib/dashboard-ui";

type RiskFilter = "all" | "medium" | "high";

const NODE_TYPE_OPTIONS: { key: GraphNodeType; label: string; icon: typeof Phone; hint?: string }[] = [
  { key: "phone", label: "Phone", icon: Phone },
  {
    key: "pincode",
    label: "Pincode",
    icon: MapPin,
    hint: "Delivery area per customer — not a shared street address",
  },
  {
    key: "session",
    label: "Session cluster",
    icon: Clock,
    hint: "Proxy: same checkout window — not device fingerprinting",
  },
];

function passesRiskFilter(risk: GraphRiskLevel, filter: RiskFilter): boolean {
  if (filter === "all") return true;
  if (filter === "medium") return risk !== "Low";
  return risk === "High";
}

function filterGraph(
  nodes: TrustGraphApiNode[],
  edges: TrustGraphApiEdge[],
  riskFilter: RiskFilter,
  visibleTypes: Set<GraphNodeType>
) {
  const filteredNodes = nodes.filter(
    (n) => visibleTypes.has(n.type) && passesRiskFilter(n.data.riskLevel, riskFilter)
  );
  const nodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = edges.filter(
    (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
  );
  return { nodes: filteredNodes, edges: filteredEdges };
}

function NodeTooltip({ data }: { data: TrustGraphNodeData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="pointer-events-none absolute left-4 top-4 z-20 w-64 rounded-lg border border-border-default bg-bg-raised p-4 shadow-lg"
    >
      <p className="text-[10px] uppercase tracking-wide text-ink-tertiary font-semibold mb-1">
        {data.nodeType}
      </p>
      <p className="text-sm font-semibold text-ink-primary">{data.label}</p>
      {data.nodeType === "phone" && (
        <div className="mt-2 space-y-1 text-xs text-ink-secondary">
          <p>Phone: {maskPhone(data.rawValue, false)}</p>
          {data.customerName && <p>Name: {data.customerName}</p>}
          {data.trustScore != null && (
            <p>
              Trust score: <span className="font-mono font-semibold">{data.trustScore}</span> (
              {data.trustLabel})
            </p>
          )}
          <p>Orders: {data.orderCount}</p>
        </div>
      )}
      {data.nodeType === "pincode" && (
        <div className="mt-2 space-y-1 text-xs text-ink-secondary">
          <p>Pincode {data.rawValue}</p>
          {data.nodeSubtitle && <p className="text-ink-tertiary">{data.nodeSubtitle}</p>}
          <p>Orders to this pincode: {data.orderCount}</p>
        </div>
      )}
      {data.nodeType === "session" && (
        <div className="mt-2 space-y-1 text-xs text-ink-secondary">
          <p>{data.nodeSubtitle}</p>
          <p>Orders in cluster: {data.sessionOrderCount ?? data.orderCount}</p>
        </div>
      )}
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: getRiskColor(data.riskLevel) }}
        />
        <span className="text-ink-secondary">
          {data.riskLevel} risk · {data.fraudSignalCount} fraud signal(s)
        </span>
      </div>
    </motion.div>
  );
}

function FilterPanel({
  riskFilter,
  setRiskFilter,
  visibleTypes,
  toggleType,
  phoneFocus,
  setPhoneFocus,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onApply,
  loading,
}: {
  riskFilter: RiskFilter;
  setRiskFilter: (v: RiskFilter) => void;
  visibleTypes: Set<GraphNodeType>;
  toggleType: (t: GraphNodeType) => void;
  phoneFocus: string;
  setPhoneFocus: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  onApply: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-ink-primary uppercase tracking-wide">
          Focus phone
        </label>
        <input
          type="tel"
          value={phoneFocus}
          onChange={(e) => setPhoneFocus(e.target.value)}
          placeholder="e.g. 9998887776"
          className="mt-1.5 w-full px-3 py-2 rounded-lg border border-border-default bg-bg-base text-sm text-ink-primary"
        />
        <p className="text-[10px] text-ink-tertiary mt-1">Leave blank to show full merchant network</p>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-primary uppercase tracking-wide">
          Risk level
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["all", "medium", "high"] as RiskFilter[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setRiskFilter(level)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                riskFilter === level
                  ? "bg-accent-muted border-accent/30 text-accent"
                  : "border-border-default text-ink-secondary hover:bg-bg-sunken"
              }`}
            >
              {level === "all" ? "All" : level === "medium" ? "Medium+" : "High only"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-primary uppercase tracking-wide">
          Node types
        </label>
        <div className="mt-2 space-y-2">
          {NODE_TYPE_OPTIONS.map(({ key, label, icon: Icon, hint }) => (
            <label key={key} className="flex items-start gap-2 text-sm text-ink-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={visibleTypes.has(key)}
                onChange={() => toggleType(key)}
                className="rounded border-border-default mt-0.5"
              />
              <span>
                <span className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </span>
                {hint && <span className="block text-[10px] text-ink-tertiary mt-0.5">{hint}</span>}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-ink-primary uppercase tracking-wide">
            From
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1.5 w-full px-2 py-2 rounded-lg border border-border-default bg-bg-base text-xs"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-primary uppercase tracking-wide">
            To
          </label>
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

export default function TrustGraphPage() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rawNodes, setRawNodes] = useState<TrustGraphApiNode[]>([]);
  const [rawEdges, setRawEdges] = useState<TrustGraphApiEdge[]>([]);
  const [isEmpty, setIsEmpty] = useState(false);
  const [orderCount, setOrderCount] = useState(0);

  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [visibleTypes, setVisibleTypes] = useState<Set<GraphNodeType>>(
    () => new Set(["phone", "pincode", "session"])
  );
  const [phoneFocus, setPhoneFocus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ phone: "", startDate: "", endDate: "" });

  const [hoveredNode, setHoveredNode] = useState<TrustGraphNodeData | null>(null);

  const loadGraph = useCallback(async (filters = appliedFilters) => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchTrustGraph({
        phone: filters.phone || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      if (!result.success) {
        setError(result.message || "Failed to load trust graph");
        setRawNodes([]);
        setRawEdges([]);
        setIsEmpty(true);
        return;
      }
      setRawNodes(result.nodes);
      setRawEdges(result.edges);
      setIsEmpty(result.isEmpty);
      setOrderCount(result.orderCount);
    } catch {
      setError("Failed to load trust graph");
      setIsEmpty(true);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const result = await fetchTrustGraph({});
        if (!active) return;
        if (!result.success) {
          setError(result.message || "Failed to load trust graph");
          setRawNodes([]);
          setRawEdges([]);
          setIsEmpty(true);
          return;
        }
        setRawNodes(result.nodes);
        setRawEdges(result.edges);
        setIsEmpty(result.isEmpty);
        setOrderCount(result.orderCount);
      } catch {
        if (active) {
          setError("Failed to load trust graph");
          setIsEmpty(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const toggleType = (type: GraphNodeType) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const { nodes, edges } = useMemo(
    () => filterGraph(rawNodes, rawEdges, riskFilter, visibleTypes),
    [rawNodes, rawEdges, riskFilter, visibleTypes]
  );

  const handleApply = () => {
    const next = { phone: phoneFocus.trim(), startDate, endDate };
    setAppliedFilters(next);
    void loadGraph(next);
    if (!isDesktop) setFilterOpen(false);
  };

  const handleNodeHover = useCallback((data: TrustGraphNodeData | null) => {
    setHoveredNode(data);
  }, []);

  const showEmpty =
    !loading && (isEmpty || nodes.length === 0 || edges.length === 0);

  return (
    <div className="flex flex-col h-[calc(100dvh-7rem)] min-h-[560px] gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-default pb-4 shrink-0">
        <div className="flex items-start gap-3">
          <Link
            href="/dashboard/fraud-center"
            className="mt-1 text-ink-tertiary hover:text-ink-primary"
            aria-label="Back to Fraud Center"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-lg border border-accent/20 bg-accent-muted flex items-center justify-center shrink-0">
            <Network className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink-primary">Trust Graph</h1>
            <p className="text-sm text-ink-secondary mt-0.5">
              Linked identifiers across orders — phones, delivery pincodes, and checkout session clusters.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-tertiary hidden sm:inline">
            {orderCount} order(s) in scope · {nodes.length} nodes
          </span>
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
      </div>

      <div className="flex flex-1 min-h-0 gap-4">
        {isDesktop && (
          <aside className="w-64 shrink-0 border border-border-default rounded-lg bg-bg-raised p-4 overflow-y-auto">
            <h2 className="text-xs font-semibold text-ink-primary uppercase tracking-wide mb-4 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" />
              Filters
            </h2>
            <FilterPanel
              riskFilter={riskFilter}
              setRiskFilter={setRiskFilter}
              visibleTypes={visibleTypes}
              toggleType={toggleType}
              phoneFocus={phoneFocus}
              setPhoneFocus={setPhoneFocus}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              onApply={handleApply}
              loading={loading}
            />
          </aside>
        )}

        <div className="relative flex-1 min-w-0 min-h-0">
          {error && (
            <div className="mb-3 text-sm text-negative border border-negative/20 bg-negative/5 rounded-lg px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[400px] text-sm text-ink-secondary">
              Building trust graph…
            </div>
          ) : showEmpty ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] border border-border-default rounded-lg bg-bg-raised p-8 text-center">
              <Network className="w-10 h-10 text-ink-tertiary mb-3" />
              <p className="text-sm font-semibold text-ink-primary">No linked network found</p>
              <p className="text-sm text-ink-secondary mt-2 max-w-md">
                {appliedFilters.phone
                  ? "This customer has no shared identifiers with other orders in the selected period."
                  : "No cross-order identifier links match your filters. Try widening the date range or clearing the phone focus."}
              </p>
            </div>
          ) : (
            <>
              <AnimatePresence>
                {hoveredNode && <NodeTooltip data={hoveredNode} />}
              </AnimatePresence>
              <div className="absolute bottom-3 left-3 z-10 max-w-xs rounded-lg border border-border-default bg-bg-raised/95 px-3 py-2 text-[10px] text-ink-secondary shadow-sm backdrop-blur-sm">
                <p className="font-semibold text-ink-primary uppercase tracking-wide mb-1">Legend</p>
                <ul className="space-y-1">
                  <li>
                    <span className="font-semibold text-ink-primary">Pincode</span> — delivery area for one
                    customer; shared pincode does not imply identity link.
                  </li>
                  <li>
                    <span className="font-semibold text-ink-primary">Session cluster</span> — proxy signal
                    (merchant + 15‑min window); not verified device fingerprinting.
                  </li>
                  <li>
                    <span className="font-semibold text-ink-primary">Dashed phone edge</span> — documented
                    fraud-cluster link from order investigation.
                  </li>
                </ul>
              </div>
              <TrustGraphCanvas
                apiNodes={nodes}
                apiEdges={edges}
                onNodeHover={handleNodeHover}
              />
            </>
          )}
        </div>
      </div>

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
                riskFilter={riskFilter}
                setRiskFilter={setRiskFilter}
                visibleTypes={visibleTypes}
                toggleType={toggleType}
                phoneFocus={phoneFocus}
                setPhoneFocus={setPhoneFocus}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
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
