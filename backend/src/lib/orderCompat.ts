/**
 * Legacy Order field accessors.
 *
 * The V4 schema made phone, pincode, riskScore, statusReason nullable
 * (they live in ShippingAddress / RiskAssessment in the normalized design).
 * These helpers let the existing service layer read them without scattered null-checks.
 */
import type { Order } from "@prisma/client";

export function orderPhone(o: Order): string {
  return o.phone ?? "";
}

export function orderPincode(o: Order): string {
  return o.pincode ?? "";
}

export function orderRiskScore(o: Order): number {
  return o.riskScore ?? 0;
}

export function orderStatusReason(o: Order): string {
  return o.statusReason ?? "";
}
