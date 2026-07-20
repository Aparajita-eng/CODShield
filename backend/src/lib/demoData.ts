import { randomUUID } from "crypto";
import { hashApiKey } from "./auth";
import type { Blacklist, Claim, Merchant, Order, PincodeRisk } from "@prisma/client";
import { IntegrationProvider, OverallStatus, PaymentMode, VerificationStatus, WorkflowStage } from "@prisma/client";

export const DEMO_MERCHANT_BETA_ID = "a0000000-0000-4000-8000-000000000002";
export const DEMO_MERCHANT_DELTA_ID = "a0000000-0000-4000-8000-000000000003";

/** Cross-merchant auth test fixture — Beta merchant order; excluded from Acme-scoped dashboards. */
export const DEMO_ORDER_BETA_FIXTURE_ID = "b0000000-0000-4000-8000-0000000000999";

/**
 * Demo-only merchant UUID for the Acme Apparel seed account.
 * Demo sessions are bound to this merchant; override via DEMO_MERCHANT_ID in backend/.env.
 */
export const DEMO_MERCHANT_ACME_ID =
  process.env.DEMO_MERCHANT_ID || "a0000000-0000-4000-8000-000000000001";

const merchantCreatedAt = new Date("2025-06-01T00:00:00Z");

export const demoMerchants: Merchant[] = [
  {
    id: DEMO_MERCHANT_ACME_ID,
    name: "Acme Apparel",
    apiKeyHash: hashApiKey("codshield_live_acme_growth_9843"),
    apiKeyMask: "codshield_live_acme_••••••••_9843",
    tier: "Growth",
    claimRatio: 4.0,
    createdAt: merchantCreatedAt,
  },
  {
    id: DEMO_MERCHANT_BETA_ID,
    name: "Beta Test Co.",
    apiKeyHash: hashApiKey("codshield_live_beta_test_5678"),
    apiKeyMask: "codshield_live_beta_••••••••_5678",
    tier: "Starter",
    claimRatio: 1.5,
    createdAt: merchantCreatedAt,
  },
  {
    id: DEMO_MERCHANT_DELTA_ID,
    name: "Delta Direct",
    apiKeyHash: hashApiKey("codshield_live_delta_test_9012"),
    apiKeyMask: "codshield_live_delta_••••••••_9012",
    tier: "Enterprise",
    claimRatio: 9.5,
    createdAt: merchantCreatedAt,
  },
];

export const demoPincodeRisks: PincodeRisk[] = [
  { pincode: "560034", riskWeight: 0.15 },
  { pincode: "110044", riskWeight: 0.65 },
  { pincode: "400072", riskWeight: 0.85 },
  { pincode: "600041", riskWeight: 0.12 },
  { pincode: "700091", riskWeight: 0.28 },
  { pincode: "500081", riskWeight: 0.18 },
  { pincode: "380009", riskWeight: 0.22 },
  { pincode: "411001", riskWeight: 0.2 },
  { pincode: "122001", riskWeight: 0.45 },
  { pincode: "201301", riskWeight: 0.55 },
];

const blacklistCreatedAt = new Date("2025-08-01T00:00:00Z");

export const demoBlacklists: Blacklist[] = [
  {
    phone: "9123456780",
    refusalCount: 3,
    reason: "Repeat COD refusal (3 orders, 60 days)",
    createdAt: blacklistCreatedAt,
  },
  {
    phone: "9876543211",
    refusalCount: 2,
    reason: "Multiple accounts, same device ID",
    createdAt: blacklistCreatedAt,
  },
  {
    phone: "9998887776",
    refusalCount: 4,
    reason: "Address flagged by another merchant",
    createdAt: blacklistCreatedAt,
  },
  {
    phone: "8887776665",
    refusalCount: 1,
    reason: "Delivery attempt cancelled post-dispatch",
    createdAt: blacklistCreatedAt,
  },
];

// Stub buyer IDs for in-memory demo — real buyer rows exist in DB after seeding
const BUYER_DEMO_ID = "buyer-demo-001";
const BUYER_DELHI_ID = "buyer-delhi-001";
const BUYER_MUMBAI_ID = "buyer-mumbai-001";
const BUYER_CHENNAI_ID = "buyer-chennai-001";
const BUYER_AHMEDABAD_ID = "buyer-ahmedabad-001";
const BUYER_BETA_ID = "buyer-beta-001";

export const demoOrders: Order[] = [
  {
    id: "b0000000-0000-4000-8000-000000000001",
    merchantId: DEMO_MERCHANT_ACME_ID,
    buyerId: BUYER_DEMO_ID,
    value: 1240.0,
    paymentMode: PaymentMode.COD,
    currentStage: WorkflowStage.COMPLETED,
    overallStatus: OverallStatus.PROTECTED,
    verificationStatus: VerificationStatus.VERIFIED,
    externalOrderId: "#1001",
    providerOrderId: null,
    provider: IntegrationProvider.DEMO,
    integrationId: null,
    // Legacy fields for existing service compatibility
    phone: "9876543210",
    pincode: "560034",
    riskScore: 27,
    protectionStatus: "Protected",
    fulfillmentStatus: "Delivered",
    statusReason: "Low risk pincode and clear phone history",
    fraudFlagged: false,
    createdAt: new Date("2026-01-12T10:30:00Z"),
    updatedAt: new Date("2026-01-12T10:30:00Z"),
    deletedAt: null,
  },
  {
    id: "b0000000-0000-4000-8000-000000000002",
    merchantId: DEMO_MERCHANT_ACME_ID,
    buyerId: BUYER_DEMO_ID,
    value: 2180.0,
    paymentMode: PaymentMode.COD,
    currentStage: WorkflowStage.COMPLETED,
    overallStatus: OverallStatus.PROTECTED,
    verificationStatus: VerificationStatus.VERIFIED,
    externalOrderId: "#1002",
    providerOrderId: null,
    provider: IntegrationProvider.DEMO,
    integrationId: null,
    phone: "9876543210",
    pincode: "560034",
    riskScore: 22,
    protectionStatus: "Protected",
    fulfillmentStatus: "Delivered",
    statusReason: "Repeat buyer with clean delivery history",
    fraudFlagged: false,
    createdAt: new Date("2025-11-08T14:15:00Z"),
    updatedAt: new Date("2025-11-08T14:15:00Z"),
    deletedAt: null,
  },
  {
    id: "b0000000-0000-4000-8000-000000000003",
    merchantId: DEMO_MERCHANT_ACME_ID,
    buyerId: BUYER_DEMO_ID,
    value: 890.0,
    paymentMode: PaymentMode.COD,
    currentStage: WorkflowStage.COMPLETED,
    overallStatus: OverallStatus.PROTECTED,
    verificationStatus: VerificationStatus.VERIFIED,
    externalOrderId: "#1003",
    providerOrderId: null,
    provider: IntegrationProvider.DEMO,
    integrationId: null,
    phone: "9876543210",
    pincode: "500081",
    riskScore: 18,
    protectionStatus: "Protected",
    fulfillmentStatus: "Delivered",
    statusReason: "Low order value. Verified pincode",
    fraudFlagged: false,
    createdAt: new Date("2025-09-20T09:00:00Z"),
    updatedAt: new Date("2025-09-20T09:00:00Z"),
    deletedAt: null,
  },
  {
    id: "b0000000-0000-4000-8000-000000000004",
    merchantId: DEMO_MERCHANT_ACME_ID,
    buyerId: BUYER_DEMO_ID,
    value: 1560.0,
    paymentMode: PaymentMode.COD,
    currentStage: WorkflowStage.COMPLETED,
    overallStatus: OverallStatus.PROTECTED,
    verificationStatus: VerificationStatus.VERIFIED,
    externalOrderId: "#1004",
    providerOrderId: null,
    provider: IntegrationProvider.DEMO,
    integrationId: null,
    phone: "9876543210",
    pincode: "600041",
    riskScore: 24,
    protectionStatus: "Protected",
    fulfillmentStatus: "Delivered",
    statusReason: "Standard COD order delivered successfully",
    fraudFlagged: false,
    createdAt: new Date("2026-03-02T11:45:00Z"),
    updatedAt: new Date("2026-03-02T11:45:00Z"),
    deletedAt: null,
  },
  {
    id: "b0000000-0000-4000-8000-000000000005",
    merchantId: DEMO_MERCHANT_ACME_ID,
    buyerId: BUYER_DELHI_ID,
    value: 3890.0,
    paymentMode: PaymentMode.COD,
    currentStage: WorkflowStage.WHATSAPP,
    overallStatus: OverallStatus.HELD,
    verificationStatus: VerificationStatus.PENDING,
    externalOrderId: "#1005",
    providerOrderId: null,
    provider: IntegrationProvider.DEMO,
    integrationId: null,
    phone: "9123456780",
    pincode: "110044",
    riskScore: 58,
    protectionStatus: "Held",
    fulfillmentStatus: "Pending",
    statusReason: "[cluster:cod-ring-delhi] Medium risk pincode. Phone blacklisted with 3 refusals. OTP verification required",
    fraudFlagged: false,
    createdAt: new Date("2026-02-18T16:20:00Z"),
    updatedAt: new Date("2026-02-18T16:20:00Z"),
    deletedAt: null,
  },
  {
    id: "b0000000-0000-4000-8000-000000000006",
    merchantId: DEMO_MERCHANT_ACME_ID,
    buyerId: BUYER_DELHI_ID,
    value: 2450.0,
    paymentMode: PaymentMode.COD,
    currentStage: WorkflowStage.COMPLETED,
    overallStatus: OverallStatus.HELD,
    verificationStatus: VerificationStatus.VERIFIED,
    externalOrderId: "#1006",
    providerOrderId: null,
    provider: IntegrationProvider.DEMO,
    integrationId: null,
    phone: "9123456780",
    pincode: "122001",
    riskScore: 62,
    protectionStatus: "Held",
    fulfillmentStatus: "Delivered",
    statusReason: "Delivered successfully. Buyer verified via alternate contact",
    fraudFlagged: false,
    createdAt: new Date("2025-12-05T08:30:00Z"),
    updatedAt: new Date("2025-12-05T08:30:00Z"),
    deletedAt: null,
  },
  {
    id: "b0000000-0000-4000-8000-000000000007",
    merchantId: DEMO_MERCHANT_ACME_ID,
    buyerId: BUYER_DELHI_ID,
    value: 1720.0,
    paymentMode: PaymentMode.COD,
    currentStage: WorkflowStage.COMPLETED,
    overallStatus: OverallStatus.FAILED,
    verificationStatus: VerificationStatus.VERIFIED,
    externalOrderId: "#1007",
    providerOrderId: null,
    provider: IntegrationProvider.DEMO,
    integrationId: null,
    phone: "9123456780",
    pincode: "201301",
    riskScore: 55,
    protectionStatus: "Failed",
    fulfillmentStatus: "Delivered",
    statusReason: "Delivered on second attempt after location confirmation",
    fraudFlagged: false,
    createdAt: new Date("2025-10-14T13:10:00Z"),
    updatedAt: new Date("2025-10-14T13:10:00Z"),
    deletedAt: null,
  },
  {
    id: "b0000000-0000-4000-8000-000000000008",
    merchantId: DEMO_MERCHANT_ACME_ID,
    buyerId: BUYER_MUMBAI_ID,
    value: 6150.0,
    paymentMode: PaymentMode.COD,
    currentStage: WorkflowStage.DECISION,
    overallStatus: OverallStatus.FAILED,
    verificationStatus: VerificationStatus.REJECTED,
    externalOrderId: "#1008",
    providerOrderId: null,
    provider: IntegrationProvider.DEMO,
    integrationId: null,
    phone: "9998887776",
    pincode: "400072",
    riskScore: 88,
    protectionStatus: "Failed",
    fulfillmentStatus: "RTO",
    statusReason: "[cluster:cod-ring-delhi] High risk pincode. Phone blacklisted with 4 refusals",
    fraudFlagged: true,
    createdAt: new Date("2026-01-28T12:00:00Z"),
    updatedAt: new Date("2026-01-28T12:00:00Z"),
    deletedAt: null,
  },
  {
    id: "b0000000-0000-4000-8000-000000000009",
    merchantId: DEMO_MERCHANT_ACME_ID,
    buyerId: BUYER_MUMBAI_ID,
    value: 4820.0,
    paymentMode: PaymentMode.COD,
    currentStage: WorkflowStage.DECISION,
    overallStatus: OverallStatus.CANCELLED,
    verificationStatus: VerificationStatus.REJECTED,
    externalOrderId: "#1009",
    providerOrderId: null,
    provider: IntegrationProvider.DEMO,
    integrationId: null,
    phone: "9998887776",
    pincode: "400072",
    riskScore: 82,
    protectionStatus: "Failed",
    fulfillmentStatus: "Cancelled",
    statusReason: "[cluster:cod-ring-delhi] Manually flagged as fraud by merchant",
    fraudFlagged: true,
    createdAt: new Date("2025-11-22T17:40:00Z"),
    updatedAt: new Date("2025-11-22T17:40:00Z"),
    deletedAt: null,
  },
  {
    id: "b0000000-0000-4000-8000-000000000010",
    merchantId: DEMO_MERCHANT_ACME_ID,
    buyerId: BUYER_MUMBAI_ID,
    value: 3290.0,
    paymentMode: PaymentMode.COD,
    currentStage: WorkflowStage.DECISION,
    overallStatus: OverallStatus.FAILED,
    verificationStatus: VerificationStatus.REJECTED,
    externalOrderId: "#1010",
    providerOrderId: null,
    provider: IntegrationProvider.DEMO,
    integrationId: null,
    phone: "9998887776",
    pincode: "110044",
    riskScore: 76,
    protectionStatus: "Failed",
    fulfillmentStatus: "RTO",
    statusReason: "[cluster:cod-ring-delhi] Address mismatch flagged during verification",
    fraudFlagged: true,
    createdAt: new Date("2025-09-03T10:05:00Z"),
    updatedAt: new Date("2025-09-03T10:05:00Z"),
    deletedAt: null,
  },
  {
    id: "b0000000-0000-4000-8000-000000000011",
    merchantId: DEMO_MERCHANT_ACME_ID,
    buyerId: BUYER_CHENNAI_ID,
    value: 980.0,
    paymentMode: PaymentMode.COD,
    currentStage: WorkflowStage.COMPLETED,
    overallStatus: OverallStatus.PROTECTED,
    verificationStatus: VerificationStatus.VERIFIED,
    externalOrderId: "#1011",
    providerOrderId: null,
    provider: IntegrationProvider.DEMO,
    integrationId: null,
    phone: "8887776665",
    pincode: "600041",
    riskScore: 15,
    protectionStatus: "Protected",
    fulfillmentStatus: "Delivered",
    statusReason: "Low risk order value. Delivered to verified customer",
    fraudFlagged: false,
    createdAt: new Date("2026-02-10T15:25:00Z"),
    updatedAt: new Date("2026-02-10T15:25:00Z"),
    deletedAt: null,
  },
  {
    id: "b0000000-0000-4000-8000-000000000012",
    merchantId: DEMO_MERCHANT_ACME_ID,
    buyerId: BUYER_CHENNAI_ID,
    value: 1340.0,
    paymentMode: PaymentMode.COD,
    currentStage: WorkflowStage.COMPLETED,
    overallStatus: OverallStatus.PROTECTED,
    verificationStatus: VerificationStatus.VERIFIED,
    externalOrderId: "#1012",
    providerOrderId: null,
    provider: IntegrationProvider.DEMO,
    integrationId: null,
    phone: "8887776665",
    pincode: "600041",
    riskScore: 19,
    protectionStatus: "Protected",
    fulfillmentStatus: "Delivered",
    statusReason: "Successful repeat delivery to same pincode",
    fraudFlagged: false,
    createdAt: new Date("2025-12-18T09:50:00Z"),
    updatedAt: new Date("2025-12-18T09:50:00Z"),
    deletedAt: null,
  },
  {
    id: "b0000000-0000-4000-8000-000000000013",
    merchantId: DEMO_MERCHANT_ACME_ID,
    buyerId: BUYER_AHMEDABAD_ID,
    value: 2100.0,
    paymentMode: PaymentMode.COD,
    currentStage: WorkflowStage.TRUST_SCORE,
    overallStatus: OverallStatus.HELD,
    verificationStatus: VerificationStatus.PENDING,
    externalOrderId: "#1013",
    providerOrderId: null,
    provider: IntegrationProvider.DEMO,
    integrationId: null,
    phone: "9876543211",
    pincode: "380009",
    riskScore: 48,
    protectionStatus: "Held",
    fulfillmentStatus: "Pending",
    statusReason: "Multiple accounts linked to same device ID",
    fraudFlagged: false,
    createdAt: new Date("2026-03-05T07:15:00Z"),
    updatedAt: new Date("2026-03-05T07:15:00Z"),
    deletedAt: null,
  },
  {
    id: DEMO_ORDER_BETA_FIXTURE_ID,
    merchantId: DEMO_MERCHANT_BETA_ID,
    buyerId: BUYER_BETA_ID,
    value: 1500.0,
    paymentMode: PaymentMode.COD,
    currentStage: WorkflowStage.PINCODE,
    overallStatus: OverallStatus.HELD,
    verificationStatus: VerificationStatus.PENDING,
    externalOrderId: "#9999",
    providerOrderId: null,
    provider: IntegrationProvider.DEMO,
    integrationId: null,
    phone: "9000000001",
    pincode: "411001",
    riskScore: 35,
    protectionStatus: "Held",
    fulfillmentStatus: "Pending",
    statusReason: "[fixture:beta-test-co] Cross-merchant auth test order — Beta Test Co. only",
    fraudFlagged: false,
    createdAt: new Date("2026-03-01T10:00:00Z"),
    updatedAt: new Date("2026-03-01T10:00:00Z"),
    deletedAt: null,
  },
];

/** Mutable in-memory claims for demo mode only — lost on server restart, not a substitute for Postgres. */
export const demoClaims: Claim[] = [
  {
    id: "c0000000-0000-4000-8000-000000000001",
    orderId: "b0000000-0000-4000-8000-000000000006",
    proofUrl: "https://dispatch.courier/returns/pod-refusal-006.pdf",
    status: "Pending",
    step: 1,
    notes: "Awaiting POD response from courier partner.",
    createdAt: new Date("2026-02-20T10:00:00Z"),
  },
  {
    id: "c0000000-0000-4000-8000-000000000002",
    orderId: "b0000000-0000-4000-8000-000000000007",
    proofUrl: "https://dispatch.courier/returns/delivery-failure-007.pdf",
    status: "Under Review",
    step: 2,
    notes: "Logistics partner reported delivery address could not be located.",
    createdAt: new Date("2025-10-20T09:30:00Z"),
  },
  {
    id: "c0000000-0000-4000-8000-000000000003",
    orderId: "b0000000-0000-4000-8000-000000000008",
    proofUrl: "https://dispatch.courier/returns/rto-proof-008.pdf",
    status: "Approved",
    step: 3,
    notes: "RTO confirmed. Reimbursement processed to merchant wallet.",
    createdAt: new Date("2026-02-01T14:15:00Z"),
  },
  {
    id: "c0000000-0000-4000-8000-000000000004",
    orderId: "b0000000-0000-4000-8000-000000000010",
    proofUrl: "https://dispatch.courier/returns/address-mismatch-010.pdf",
    status: "Rejected",
    step: 3,
    notes: "Claim rejected due to matching customer phone geolocation history.",
    createdAt: new Date("2025-09-10T11:00:00Z"),
  },
  {
    id: "c0000000-0000-4000-8000-000000000005",
    orderId: "b0000000-0000-4000-8000-000000000003",
    proofUrl: "https://dispatch.courier/returns/payout-claim-003.pdf",
    status: "Paid",
    step: 4,
    notes: "Payout verified. INR 890 credited to account bank balance.",
    createdAt: new Date("2025-10-01T08:00:00Z"),
  },
  {
    id: "c0000000-0000-4000-8000-000000000999",
    orderId: "b0000000-0000-4000-8000-0000000000999",
    proofUrl: "https://dispatch.courier/returns/beta-refusal.pdf",
    status: "Pending",
    step: 1,
    notes: "Beta Test Co. private claim notes.",
    createdAt: new Date("2026-03-02T10:00:00Z"),
  },
];

export type ClaimWithOrder = Claim & { order: Order };

export function findDemoClaimByOrderId(orderId: string): Claim | null {
  return demoClaims.find((c) => c.orderId === orderId) ?? null;
}

export function createDemoClaim(orderId: string, proofUrl: string): ClaimWithOrder {
  const existing = findDemoClaimByOrderId(orderId);
  if (existing) {
    throw new Error("A claim has already been registered for this order");
  }

  const order = demoOrders.find((o) => o.id === orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  const claim: Claim = {
    id: randomUUID(),
    orderId,
    proofUrl,
    status: "Pending",
    step: 1,
    notes: null,
    createdAt: new Date(),
  };
  demoClaims.push(claim);
  return { ...claim, order };
}

export function listDemoClaimsForMerchant(merchantId: string): ClaimWithOrder[] {
  return demoClaims
    .map((claim) => {
      const order = demoOrders.find((o) => o.id === claim.orderId);
      return order && order.merchantId === merchantId ? { ...claim, order } : null;
    })
    .filter((c): c is ClaimWithOrder => c !== null)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export type BulkOrderAction = "verify" | "flag_fraud";

/** In-memory bulk order updates for demo mode — not persisted across restarts. */
export function bulkUpdateDemoOrders(orderIds: string[], action: BulkOrderAction): Order[] {
  const updated: Order[] = [];
  for (const orderId of orderIds) {
    const index = demoOrders.findIndex((o) => o.id === orderId);
    if (index === -1) continue;

    const order = demoOrders[index];
    if (action === "verify") {
      demoOrders[index] = {
        ...order,
        fulfillmentStatus: "Verified",
        protectionStatus: "Protected",
        overallStatus: OverallStatus.PROTECTED,
        verificationStatus: VerificationStatus.VERIFIED,
        fraudFlagged: false,
      };
    } else {
      demoOrders[index] = {
        ...order,
        fulfillmentStatus: "Cancelled",
        protectionStatus: "Failed",
        overallStatus: OverallStatus.FAILED,
        verificationStatus: VerificationStatus.REJECTED,
        fraudFlagged: true,
        statusReason: "Manually flagged as fraud by merchant",
      };
    }
    updated.push(demoOrders[index]);
  }
  return updated.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function isDemoDataMode(): boolean {
  return process.env.CODSHIELD_DEMO_MODE === 'true';
}
