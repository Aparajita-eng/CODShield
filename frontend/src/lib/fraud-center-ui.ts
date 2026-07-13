export type FraudCenterSeverity = "Low" | "Medium" | "High" | "Critical";

export type FraudCenterStatus =
  | "Open"
  | "Investigating"
  | "Resolved"
  | "Dismissed";

export type TimelinePreset = "today" | "7d" | "30d" | "all";

/** Matches DashboardShowcase `getRiskBadgeStyles` — filled badges for severity. */
export function getSeverityBadgeClass(level: FraudCenterSeverity): string {
  switch (level) {
    case "Low":
      return "text-positive bg-positive/8 border-positive/20";
    case "Medium":
      return "text-warning bg-warning/8 border-warning/20";
    case "High":
      return "text-negative bg-negative/8 border-negative/20";
    case "Critical":
      return "text-negative bg-negative/12 border-negative/30";
    default:
      return "text-ink-secondary bg-bg-sunken border-border-default";
  }
}

/** Outline badges so investigation status is visually distinct from severity. */
export function getInvestigationBadgeClass(status: FraudCenterStatus): string {
  switch (status) {
    case "Open":
      return "text-negative border-negative/50 bg-transparent";
    case "Investigating":
      return "text-warning border-warning/50 bg-transparent";
    case "Resolved":
      return "text-positive border-positive/50 bg-transparent";
    case "Dismissed":
      return "text-ink-tertiary border-border-default bg-transparent";
    default:
      return "text-ink-secondary border-border-default bg-transparent";
  }
}

export function formatRelativeTime(isoDate: string): string {
  const then = new Date(isoDate).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function formatFullDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isWithinTimelinePreset(isoDate: string, preset: TimelinePreset): boolean {
  if (preset === "all") return true;
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  const dayMs = 86_400_000;
  if (preset === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return then >= start.getTime();
  }
  if (preset === "7d") return now - then <= 7 * dayMs;
  if (preset === "30d") return now - then <= 30 * dayMs;
  return true;
}
