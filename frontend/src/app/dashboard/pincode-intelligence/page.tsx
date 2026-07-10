"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Filter,
  X,
  Search,
  LayoutGrid,
  Map as MapIcon,
  AlertTriangle,
} from "lucide-react";
import type { SortingState } from "@tanstack/react-table";
import { useMediaQuery, useDebouncedValue } from "@/lib/hooks";
import {
  fetchPincodeIntelligence,
  fetchPincodeDetail,
  type PincodeMetrics,
  type RiskLevel,
} from "@/lib/pincode-api";
import { DEFAULT_MIN_VOLUME, getRiskBadgeClass, RECOMMENDED_MIN_VOLUME } from "@/lib/pincode-ui";
import IndiaHeatmap from "@/components/pincode-intelligence/IndiaHeatmap";
import PincodeCharts from "@/components/pincode-intelligence/PincodeCharts";
import PincodeTable from "@/components/pincode-intelligence/PincodeTable";
import PincodeDetailDrawer from "@/components/pincode-intelligence/PincodeDetailDrawer";
import TopRiskyPanel from "@/components/pincode-intelligence/TopRiskyPanel";
import PincodeFilters from "@/components/pincode-intelligence/PincodeFilters";

type ViewTab = "heatmap" | "data";

interface AppliedFilters {
  riskLevels: RiskLevel[];
  state: string;
  minVolume: number;
  startDate: string;
  endDate: string;
}

export default function PincodeIntelligencePage() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const tableRef = useRef<HTMLDivElement>(null);

  const [viewTab, setViewTab] = useState<ViewTab>("heatmap");
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pincodes, setPincodes] = useState<PincodeMetrics[]>([]);
  const [stateAggregates, setStateAggregates] = useState<
    Awaited<ReturnType<typeof fetchPincodeIntelligence>>["stateAggregates"]
  >([]);
  const [riskDistribution, setRiskDistribution] = useState<
    { band: RiskLevel; count: number }[]
  >([]);
  const [fraudVolumeScatter, setFraudVolumeScatter] = useState<
    Awaited<ReturnType<typeof fetchPincodeIntelligence>>["fraudVolumeScatter"]
  >([]);
  const [topRisky, setTopRisky] = useState<PincodeMetrics[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [appliedMinVolume, setAppliedMinVolume] = useState(DEFAULT_MIN_VOLUME);

  const [riskLevels, setRiskLevels] = useState<RiskLevel[]>(["Low", "Medium", "High"]);
  const [stateFilter, setStateFilter] = useState("");
  const [minVolume, setMinVolume] = useState(DEFAULT_MIN_VOLUME);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    riskLevels: ["Low", "Medium", "High"],
    state: "",
    minVolume: DEFAULT_MIN_VOLUME,
    startDate: "",
    endDate: "",
  });

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const [remoteSearchMatch, setRemoteSearchMatch] = useState<PincodeMetrics | null>(null);
  const [remoteSearchNotFound, setRemoteSearchNotFound] = useState(false);
  const [mapSelectedState, setMapSelectedState] = useState<string | null>(null);

  const pincodeQuery = debouncedSearch.trim();
  const isPincodeQuery = /^\d{6}$/.test(pincodeQuery);
  const localSearchMatch = useMemo(
    () => (isPincodeQuery ? pincodes.find((p) => p.pincode === pincodeQuery) ?? null : null),
    [isPincodeQuery, pincodeQuery, pincodes]
  );
  const searchMatch =
    localSearchMatch ?? (isPincodeQuery && !localSearchMatch ? remoteSearchMatch : null);
  const searchNotFound = isPincodeQuery && !localSearchMatch && remoteSearchNotFound;
  const highlightPincode = searchMatch?.pincode ?? null;
  const highlightState = searchMatch?.state ?? null;

  const [detailPincode, setDetailPincode] = useState<PincodeMetrics | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "riskScore", desc: true }]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const riskParam =
          appliedFilters.riskLevels.length > 0 && appliedFilters.riskLevels.length < 3
            ? appliedFilters.riskLevels
            : undefined;

        const result = await fetchPincodeIntelligence({
          riskLevels: riskParam,
          state: appliedFilters.state || undefined,
          minVolume: appliedFilters.minVolume,
          startDate: appliedFilters.startDate || undefined,
          endDate: appliedFilters.endDate || undefined,
        });

        if (!active) return;
        if (!result.success) {
          setError(result.message || "Failed to load pincode data");
          setPincodes([]);
          return;
        }

        setPincodes(result.pincodes);
        setStateAggregates(result.stateAggregates);
        setRiskDistribution(result.riskDistribution);
        setFraudVolumeScatter(result.fraudVolumeScatter);
        setTopRisky(result.topRisky);
        setStates(result.states);
        setAppliedMinVolume(result.minVolume);
      } catch {
        if (active) setError("Failed to load pincode data");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [appliedFilters]);

  useEffect(() => {
    if (!isPincodeQuery || localSearchMatch) return;

    let active = true;
    (async () => {
      const result = await fetchPincodeDetail(pincodeQuery, {
        startDate: appliedFilters.startDate || undefined,
        endDate: appliedFilters.endDate || undefined,
      });
      if (!active) return;
      if (result.success && result.pincode) {
        setRemoteSearchMatch(result.pincode);
        setRemoteSearchNotFound(false);
      } else {
        setRemoteSearchMatch(null);
        setRemoteSearchNotFound(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [isPincodeQuery, localSearchMatch, pincodeQuery, appliedFilters.startDate, appliedFilters.endDate]);

  useEffect(() => {
    if (!searchMatch) return;
    const timer = setTimeout(() => {
      document.getElementById(`pincode-row-${searchMatch.pincode}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [searchMatch]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      riskLevels: [...riskLevels],
      state: stateFilter,
      minVolume,
      startDate,
      endDate,
    });
    setMapSelectedState(stateFilter || null);
    if (!isDesktop) setFilterOpen(false);
  };

  const toggleRisk = (level: RiskLevel) => {
    setRiskLevels((prev) => {
      const next = prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level];
      return next.length ? next : ["Low", "Medium", "High"];
    });
  };

  const handleStateClick = (state: string) => {
    setMapSelectedState((prev) => (prev === state ? null : state));
    setStateFilter((prev) => (prev === state ? "" : state));
    setAppliedFilters((f) => ({
      ...f,
      state: f.state === state ? "" : state,
    }));
  };

  const handleTopRiskySelect = (pincode: string) => {
    setSearchInput(pincode);
  };

  const effectiveStateFilter = mapSelectedState || appliedFilters.state;

  return (
    <div className="space-y-4">
      <nav className="text-xs text-ink-tertiary">
        <Link href="/dashboard" className="hover:text-accent transition-colors">
          Dashboard
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-secondary">Pincode Intelligence</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-default pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg border border-accent/20 bg-accent-muted flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink-primary">Pincode Intelligence</h1>
            <p className="text-sm text-ink-secondary mt-0.5">
              India-wide delivery risk by pincode — heatmap, trends, and order-level drill-down.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setViewTab("heatmap")}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
            viewTab === "heatmap"
              ? "bg-accent-muted border-accent/30 text-accent"
              : "border-border-default text-ink-secondary hover:bg-bg-sunken"
          }`}
        >
          <MapIcon className="w-4 h-4" />
          Heatmap
        </button>
        <button
          type="button"
          onClick={() => setViewTab("data")}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
            viewTab === "data"
              ? "bg-accent-muted border-accent/30 text-accent"
              : "border-border-default text-ink-secondary hover:bg-bg-sunken"
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Data view
        </button>
        <span className="text-xs text-ink-tertiary ml-auto hidden sm:inline">
          Min volume: {appliedMinVolume} · recommend {RECOMMENDED_MIN_VOLUME}+ for map signal
        </span>
      </div>

      {error && (
        <div className="text-sm text-negative border border-negative/20 bg-negative/5 rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 min-h-0">
        {isDesktop && (
          <aside className="w-64 shrink-0 border border-border-default rounded-lg bg-bg-raised p-4 h-fit">
            <h2 className="text-xs font-semibold text-ink-primary uppercase tracking-wide mb-4 flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" />
              Filters
            </h2>
            <PincodeFilters
              riskLevels={riskLevels}
              onRiskToggle={toggleRisk}
              state={stateFilter}
              onStateChange={setStateFilter}
              states={states}
              minVolume={minVolume}
              onMinVolumeChange={setMinVolume}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onApply={handleApplyFilters}
              loading={loading}
            />
          </aside>
        )}

        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Search 6-digit pincode…"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-default bg-bg-raised text-sm font-mono text-ink-primary"
              />
            </div>
            {searchNotFound && debouncedSearch.length === 6 && (
              <p className="text-sm text-negative flex items-center gap-2 px-1">
                <AlertTriangle className="w-4 h-4" />
                Pincode not found
              </p>
            )}
          </div>

          <AnimatePresence mode="wait">
            {searchMatch && debouncedSearch.length === 6 && (
              <motion.div
                key={searchMatch.pincode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="grid grid-cols-1 sm:grid-cols-4 gap-3"
              >
                <div className="sm:col-span-1 rounded-lg border border-border-default bg-bg-raised p-4">
                  <p className="text-xs text-ink-tertiary uppercase">Pincode</p>
                  <p className="text-lg font-mono font-bold text-ink-primary mt-1">{searchMatch.pincode}</p>
                  <p className="text-xs text-ink-secondary mt-1">
                    {searchMatch.city !== "Unknown area" ? searchMatch.city : searchMatch.district},{" "}
                    {searchMatch.state}
                  </p>
                </div>
                <div className="rounded-lg border border-border-default bg-bg-raised p-4">
                  <p className="text-xs text-ink-tertiary uppercase">Risk Score</p>
                  <p className="text-2xl font-mono font-bold text-ink-primary mt-1">{searchMatch.riskScore}</p>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getRiskBadgeClass(searchMatch.riskLevel)}`}
                  >
                    {searchMatch.riskLevel}
                  </span>
                </div>
                <div className="rounded-lg border border-border-default bg-bg-raised p-4">
                  <p className="text-xs text-ink-tertiary uppercase">Success %</p>
                  <p className="text-2xl font-mono font-bold text-ink-primary mt-1">{searchMatch.successPct}%</p>
                </div>
                <div className="rounded-lg border border-border-default bg-bg-raised p-4">
                  <p className="text-xs text-ink-tertiary uppercase">Fraud %</p>
                  <p className="text-2xl font-mono font-bold text-ink-primary mt-1">{searchMatch.fraudPct}%</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm text-ink-secondary">
              Loading pincode intelligence…
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {viewTab === "heatmap" ? (
                <motion.div
                  key="heatmap"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
                    <IndiaHeatmap
                      stateAggregates={stateAggregates}
                      selectedState={effectiveStateFilter || null}
                      highlightState={highlightState}
                      minVolume={appliedMinVolume}
                      onStateClick={handleStateClick}
                    />
                    <TopRiskyPanel
                      pincodes={topRisky}
                      minVolume={appliedMinVolume}
                      selectedPincode={highlightPincode}
                      onSelect={handleTopRiskySelect}
                    />
                  </div>
                  <div ref={tableRef}>
                    <PincodeTable
                      data={pincodes}
                      sorting={sorting}
                      onSortingChange={setSorting}
                      selectedPincode={detailPincode?.pincode ?? null}
                      highlightPincode={highlightPincode}
                      onRowClick={setDetailPincode}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="data"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <PincodeCharts
                    riskDistribution={riskDistribution}
                    scatterData={fraudVolumeScatter}
                  />
                  <PincodeTable
                    data={pincodes}
                    sorting={sorting}
                    onSortingChange={setSorting}
                    selectedPincode={detailPincode?.pincode ?? null}
                    highlightPincode={highlightPincode}
                    onRowClick={setDetailPincode}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      <PincodeDetailDrawer
        pincode={detailPincode}
        startDate={appliedFilters.startDate}
        endDate={appliedFilters.endDate}
        onClose={() => setDetailPincode(null)}
      />

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
              <PincodeFilters
                riskLevels={riskLevels}
                onRiskToggle={toggleRisk}
                state={stateFilter}
                onStateChange={setStateFilter}
                states={states}
                minVolume={minVolume}
                onMinVolumeChange={setMinVolume}
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onApply={handleApplyFilters}
                loading={loading}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
