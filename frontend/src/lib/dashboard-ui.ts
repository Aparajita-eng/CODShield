import type { RiskLevel } from "@/lib/orders-api";

export type TrustLabel = "Low" | "Medium" | "High";

export const getStatusColor = (status: string) => {
  switch (status) {
    case "Verified":
    case "Delivered":
      return "var(--positive)";
    case "Pending":
    case "Shipped":
      return "var(--warning)";
    case "RTO":
    case "Cancelled":
      return "var(--negative)";
    default:
      return "var(--ink-secondary)";
  }
};

export const getRiskColor = (level: RiskLevel | TrustLabel) => {
  switch (level) {
    case "Low":
      return "var(--positive)";
    case "Medium":
      return "var(--warning)";
    case "High":
      return "var(--negative)";
    default:
      return "var(--ink-secondary)";
  };
};

export const getTrustBadgeClass = (label: TrustLabel) => {
  switch (label) {
    case "High":
      return "text-positive bg-positive/8 border-positive/20";
    case "Medium":
      return "text-warning bg-warning/8 border-warning/20";
    case "Low":
      return "text-negative bg-negative/8 border-negative/20";
    default:
      return "text-ink-secondary bg-bg-sunken border-border-default";
  }
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export function maskPhone(phone: string, revealed: boolean) {
  if (revealed) return phone;
  if (phone.length <= 8) return phone.slice(0, 2) + "••••" + phone.slice(-2);
  return phone.slice(0, 6) + "••••••" + phone.slice(-2);
}

export function maskEmail(email: string, revealed: boolean) {
  if (revealed) return email;
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const maskedLocal = local.length <= 2 ? "••" : `${local.slice(0, 2)}••••`;
  return `${maskedLocal}@${domain}`;
}

export const CHART_COLORS = {
  positive: "var(--positive)",
  warning: "var(--warning)",
  negative: "var(--negative)",
  accent: "var(--accent)",
  inkSecondary: "var(--ink-secondary)",
};

export const DELIVERY_CHART_COLORS: Record<string, string> = {
  Delivered: CHART_COLORS.positive,
  RTO: CHART_COLORS.negative,
  Cancelled: CHART_COLORS.negative,
  Pending: CHART_COLORS.warning,
};
