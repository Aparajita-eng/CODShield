import type { Claim, Merchant, Order } from "@prisma/client";
import type { ClaimWithOrder } from "./demoData";

export type ClaimDisplayStatus =
  | "Pending"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Paid";

export interface ClaimDocumentView {
  filename: string;
  uploadedAt: string;
  fileType: "pdf" | "image" | "other";
  /** Display-only mock attachment — no file storage backend yet */
  displayOnly: true;
}

export interface ClaimTimelineStepView {
  key: string;
  label: string;
  occurredAt: string | null;
  pending: boolean;
}

export interface ClaimListItemView {
  id: string;
  orderId: string;
  merchantId: string;
  merchantName: string;
  phone: string;
  amount: number;
  status: ClaimDisplayStatus;
  submittedAt: string;
  documents: ClaimDocumentView[];
  timeline: ClaimTimelineStepView[];
  notes: string | null;
  notesSupported: true;
}

const DAY_MS = 86_400_000;

function normalizeStatus(status: string, step: number): ClaimDisplayStatus {
  if (status === "Under Review") return "Under Review";
  if (status === "Approved") return step >= 4 ? "Paid" : "Approved";
  if (status === "Rejected") return "Rejected";
  if (status === "Paid") return "Paid";
  if (step >= 2) return "Under Review";
  return "Pending";
}

function fileTypeFromName(filename: string): ClaimDocumentView["fileType"] {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (/\.(png|jpe?g|webp)$/.test(lower)) return "image";
  return "other";
}

function mockDocuments(claim: Claim): ClaimDocumentView[] {
  const submitted = claim.createdAt.toISOString();
  const proofName = claim.proofUrl.split("/").pop() || "proof-of-loss.pdf";

  const byClaim: Record<string, ClaimDocumentView[]> = {
    "c0000000-0000-4000-8000-000000000001": [
      {
        filename: proofName,
        uploadedAt: submitted,
        fileType: fileTypeFromName(proofName),
        displayOnly: true,
      },
      {
        filename: "courier-rto-scan-006.jpg",
        uploadedAt: new Date(claim.createdAt.getTime() + DAY_MS).toISOString(),
        fileType: "image",
        displayOnly: true,
      },
    ],
    "c0000000-0000-4000-8000-000000000002": [
      {
        filename: proofName,
        uploadedAt: submitted,
        fileType: fileTypeFromName(proofName),
        displayOnly: true,
      },
      {
        filename: "delivery-attempt-log-007.pdf",
        uploadedAt: new Date(claim.createdAt.getTime() + DAY_MS).toISOString(),
        fileType: "pdf",
        displayOnly: true,
      },
      {
        filename: "warehouse-damage-photo-007.jpg",
        uploadedAt: new Date(claim.createdAt.getTime() + 2 * DAY_MS).toISOString(),
        fileType: "image",
        displayOnly: true,
      },
    ],
    "c0000000-0000-4000-8000-000000000003": [
      {
        filename: proofName,
        uploadedAt: submitted,
        fileType: fileTypeFromName(proofName),
        displayOnly: true,
      },
      {
        filename: "courier-claim-ack-008.pdf",
        uploadedAt: new Date(claim.createdAt.getTime() + 3 * DAY_MS).toISOString(),
        fileType: "pdf",
        displayOnly: true,
      },
    ],
    "c0000000-0000-4000-8000-000000000004": [
      {
        filename: proofName,
        uploadedAt: submitted,
        fileType: fileTypeFromName(proofName),
        displayOnly: true,
      },
      {
        filename: "rejection-rationale-010.pdf",
        uploadedAt: new Date(claim.createdAt.getTime() + 4 * DAY_MS).toISOString(),
        fileType: "pdf",
        displayOnly: true,
      },
    ],
    "c0000000-0000-4000-8000-000000000005": [
      {
        filename: proofName,
        uploadedAt: submitted,
        fileType: fileTypeFromName(proofName),
        displayOnly: true,
      },
      {
        filename: "payout-confirmation-003.pdf",
        uploadedAt: new Date(claim.createdAt.getTime() + 10 * DAY_MS).toISOString(),
        fileType: "pdf",
        displayOnly: true,
      },
    ],
  };

  return (
    byClaim[claim.id] ?? [
      {
        filename: proofName,
        uploadedAt: submitted,
        fileType: fileTypeFromName(proofName),
        displayOnly: true,
      },
    ]
  );
}

function buildTimeline(claim: Claim, displayStatus: ClaimDisplayStatus): ClaimTimelineStepView[] {
  const t0 = claim.createdAt.getTime();
  const submitted = claim.createdAt.toISOString();
  const underReviewAt = new Date(t0 + DAY_MS).toISOString();
  const decisionAt = new Date(t0 + 3 * DAY_MS).toISOString();
  const paidAt = new Date(t0 + 7 * DAY_MS).toISOString();

  const steps: ClaimTimelineStepView[] = [
    { key: "submitted", label: "Submitted", occurredAt: submitted, pending: false }
  ];

  if (displayStatus === "Pending") {
    steps.push({
      key: "review",
      label: "Under Review",
      occurredAt: null,
      pending: true,
    });
  } else if (displayStatus === "Under Review") {
    steps.push({
      key: "review",
      label: "Under Review",
      occurredAt: underReviewAt,
      pending: false,
    });
    steps.push({
      key: "approved",
      label: "Approved",
      occurredAt: null,
      pending: true,
    });
  } else if (displayStatus === "Approved") {
    steps.push({
      key: "review",
      label: "Under Review",
      occurredAt: underReviewAt,
      pending: false,
    });
    steps.push({
      key: "approved",
      label: "Approved",
      occurredAt: decisionAt,
      pending: false,
    });
    steps.push({
      key: "paid",
      label: "Paid",
      occurredAt: null,
      pending: true,
    });
  } else if (displayStatus === "Paid") {
    steps.push({
      key: "review",
      label: "Under Review",
      occurredAt: underReviewAt,
      pending: false,
    });
    steps.push({
      key: "approved",
      label: "Approved",
      occurredAt: decisionAt,
      pending: false,
    });
    steps.push({
      key: "paid",
      label: "Paid",
      occurredAt: paidAt,
      pending: false,
    });
  } else if (displayStatus === "Rejected") {
    steps.push({
      key: "review",
      label: "Under Review",
      occurredAt: underReviewAt,
      pending: false,
    });
    steps.push({
      key: "rejected",
      label: "Rejected",
      occurredAt: decisionAt,
      pending: false,
    });
  }

  return steps;
}

export function mapClaimToListItem(
  claim: ClaimWithOrder,
  merchantName: string
): ClaimListItemView {
  const displayStatus = normalizeStatus(claim.status, claim.step);

  return {
    id: claim.id,
    orderId: claim.orderId,
    merchantId: claim.order.merchantId,
    merchantName,
    phone: claim.order.phone ?? "",
    amount: claim.order.value,
    status: displayStatus,
    submittedAt: claim.createdAt.toISOString(),
    documents: mockDocuments(claim),
    timeline: buildTimeline(claim, displayStatus),
    notes: claim.notes ?? null,
    notesSupported: true,
  };
}

export function mapClaimsForMerchant(
  claims: ClaimWithOrder[],
  merchants: Merchant[],
  merchantId: string
): ClaimListItemView[] {
  const merchantName = merchants.find((m) => m.id === merchantId)?.name ?? "Unknown";
  return claims.map((claim) => mapClaimToListItem(claim, merchantName));
}
