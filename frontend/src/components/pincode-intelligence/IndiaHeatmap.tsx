"use client";

import { memo, useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import type { StateAggregate } from "@/lib/pincode-api";
import { getMapFillColor, RISK_MAP_COLORS } from "@/lib/pincode-ui";

const GEO_URL = "/data/india-states.geojson";

interface IndiaHeatmapProps {
  stateAggregates: StateAggregate[];
  selectedState: string | null;
  highlightState: string | null;
  minVolume: number;
  onStateClick: (state: string) => void;
}

function IndiaHeatmap({
  stateAggregates,
  selectedState,
  highlightState,
  minVolume,
  onStateClick,
}: IndiaHeatmapProps) {
  const stateMap = useMemo(
    () => new Map(stateAggregates.map((s) => [s.state, s])),
    [stateAggregates]
  );

  const activeHighlight = highlightState || selectedState;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border-default bg-bg-raised overflow-hidden">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 900, center: [82, 23] }}
          width={800}
          height={520}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const stateName = String(geo.properties.st_nm || "");
                const agg = stateMap.get(stateName);
                const isHighlighted = activeHighlight === stateName;
                const isSelected = selectedState === stateName;
                const fill = agg
                  ? getMapFillColor(agg.riskLevel, agg.avgRiskScore)
                  : "var(--bg-sunken)";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => onStateClick(stateName)}
                    style={{
                      default: {
                        fill,
                        stroke: isSelected
                          ? "var(--accent)"
                          : isHighlighted
                            ? "var(--ink-primary)"
                            : "var(--border-default)",
                        strokeWidth: isSelected ? 1.2 : isHighlighted ? 0.9 : 0.35,
                        outline: "none",
                        cursor: "pointer",
                        opacity: agg ? 1 : 0.55,
                      },
                      hover: {
                        fill: agg ? getMapFillColor(agg.riskLevel, Math.min(100, agg.avgRiskScore + 4)) : "var(--bg-sunken)",
                        stroke: "var(--accent)",
                        strokeWidth: 1,
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-ink-secondary">
        <p>
          District boundaries colored by state-level risk (min {minVolume} order
          {minVolume === 1 ? "" : "s"} per pincode). Click a region to filter.
        </p>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {(["Low", "Medium", "High"] as const).map((level) => (
            <span key={level} className="flex items-center gap-1.5">
              <span
                className="w-8 h-2.5 rounded-sm border border-border-default"
                style={{
                  background: `linear-gradient(90deg, ${RISK_MAP_COLORS[level].light}, ${RISK_MAP_COLORS[level].dark})`,
                }}
              />
              {level}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(IndiaHeatmap);
