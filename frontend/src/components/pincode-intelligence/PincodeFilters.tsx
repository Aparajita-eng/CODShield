"use client";

import type { RiskLevel } from "@/lib/pincode-api";
import { RECOMMENDED_MIN_VOLUME } from "@/lib/pincode-ui";

const RISK_OPTIONS: RiskLevel[] = ["Low", "Medium", "High"];

interface PincodeFiltersProps {
  riskLevels: RiskLevel[];
  onRiskToggle: (level: RiskLevel) => void;
  state: string;
  onStateChange: (state: string) => void;
  states: string[];
  minVolume: number;
  onMinVolumeChange: (value: number) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onApply: () => void;
  loading: boolean;
}

export default function PincodeFilters({
  riskLevels,
  onRiskToggle,
  state,
  onStateChange,
  states,
  minVolume,
  onMinVolumeChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  loading,
}: PincodeFiltersProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-ink-primary uppercase tracking-wide">
          Risk level
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {RISK_OPTIONS.map((level) => {
            const active = riskLevels.includes(level);
            return (
              <button
                key={level}
                type="button"
                onClick={() => onRiskToggle(level)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                  active
                    ? "bg-accent-muted border-accent/30 text-accent"
                    : "border-border-default text-ink-secondary hover:bg-bg-sunken"
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-primary uppercase tracking-wide">
          State / region
        </label>
        <select
          value={state}
          onChange={(e) => onStateChange(e.target.value)}
          className="mt-1.5 w-full px-3 py-2 rounded-lg border border-border-default bg-bg-base text-sm text-ink-primary"
        >
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold text-ink-primary uppercase tracking-wide">
          Min order volume
        </label>
        <input
          type="number"
          min={1}
          max={100}
          value={minVolume}
          onChange={(e) => onMinVolumeChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="mt-1.5 w-full px-3 py-2 rounded-lg border border-border-default bg-bg-base text-sm font-mono text-ink-primary"
        />
        <p className="text-[10px] text-ink-tertiary mt-1">
          Pincodes below this threshold are excluded from map, charts, and table. Recommend{" "}
          {RECOMMENDED_MIN_VOLUME}+ orders to avoid noise from single-order spikes.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-ink-primary uppercase tracking-wide">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="mt-1.5 w-full px-2 py-2 rounded-lg border border-border-default bg-bg-base text-xs"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-primary uppercase tracking-wide">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
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
