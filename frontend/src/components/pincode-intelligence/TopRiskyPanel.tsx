"use client";

import type { PincodeMetrics } from "@/lib/pincode-api";
import { getRiskBadgeClass } from "@/lib/pincode-ui";

interface TopRiskyPanelProps {
  pincodes: PincodeMetrics[];
  minVolume: number;
  selectedPincode: string | null;
  onSelect: (pincode: string) => void;
}

export default function TopRiskyPanel({
  pincodes,
  minVolume,
  selectedPincode,
  onSelect,
}: TopRiskyPanelProps) {
  return (
    <div className="bg-bg-raised border border-border-default rounded-lg p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-primary">
          Top risky pincodes
        </h3>
        <span className="text-[10px] text-ink-tertiary">min {minVolume} orders</span>
      </div>
      {pincodes.length === 0 ? (
        <p className="text-sm text-ink-secondary py-4 text-center">
          No pincodes meet the minimum volume threshold.
        </p>
      ) : (
        <ol className="space-y-2">
          {pincodes.map((pin, index) => (
            <li key={pin.pincode}>
              <button
                type="button"
                onClick={() => onSelect(pin.pincode)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  selectedPincode === pin.pincode
                    ? "border-accent/40 bg-accent-muted"
                    : "border-border-default hover:bg-bg-sunken"
                }`}
              >
                <span className="text-xs font-mono text-ink-tertiary w-5">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-mono font-semibold text-ink-primary">{pin.pincode}</p>
                  <p className="text-xs text-ink-secondary truncate">
                    {pin.city !== "Unknown area" ? pin.city : pin.district}, {pin.state}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getRiskBadgeClass(pin.riskLevel)}`}
                  >
                    {pin.riskScore}
                  </span>
                  <p className="text-[10px] text-ink-tertiary mt-1">{pin.orderCount} orders</p>
                </div>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
