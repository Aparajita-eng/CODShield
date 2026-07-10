import type { RiskLevel } from "@/lib/pincode-api";
import { getRiskColor } from "@/lib/dashboard-ui";

/** Risk band fill colors — light → dark within each design token band. */
export const RISK_MAP_COLORS: Record<RiskLevel, { light: string; dark: string }> = {
  Low: { light: "#86EFAC", dark: "#16A34A" },
  Medium: { light: "#FDE68A", dark: "#F59E0B" },
  High: { light: "#FCA5A5", dark: "#DC2626" },
};

export function getRiskBadgeClass(level: RiskLevel) {
  switch (level) {
    case "Low":
      return "text-positive bg-positive/8 border-positive/20";
    case "Medium":
      return "text-warning bg-warning/8 border-warning/20";
    case "High":
      return "text-negative bg-negative/8 border-negative/20";
    default:
      return "text-ink-secondary bg-bg-sunken border-border-default";
  }
}

export function getMapFillColor(riskLevel: RiskLevel, score: number): string {
  const band = RISK_MAP_COLORS[riskLevel];
  const t =
    riskLevel === "Low"
      ? Math.min(1, score / 30)
      : riskLevel === "Medium"
        ? Math.min(1, (score - 31) / 39)
        : Math.min(1, (score - 71) / 29);
  return blendHex(band.light, band.dark, 0.35 + t * 0.65);
}

function blendHex(a: string, b: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const mix = (x: number, y: number) => Math.round(x + (y - x) * t);
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(mix(r1, r2))}${hex(mix(g1, g2))}${hex(mix(b1, b2))}`;
}

export function riskScoreColor(score: number): string {
  if (score <= 30) return getRiskColor("Low");
  if (score <= 70) return getRiskColor("Medium");
  return getRiskColor("High");
}

export const DEFAULT_MIN_VOLUME = 1;
export const RECOMMENDED_MIN_VOLUME = 5;
