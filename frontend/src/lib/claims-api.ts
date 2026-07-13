export type ClaimDisplayStatus =
  | "Pending"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Paid";

export interface ClaimDocument {
  filename: string;
  uploadedAt: string;
  fileType: "pdf" | "image" | "other";
  displayOnly: true;
}

export interface ClaimTimelineStep {
  key: string;
  label: string;
  occurredAt: string | null;
  pending: boolean;
}

export interface ClaimRecord {
  id: string;
  orderId: string;
  merchantId: string;
  merchantName: string;
  phone: string;
  amount: number;
  status: ClaimDisplayStatus;
  submittedAt: string;
  documents: ClaimDocument[];
  timeline: ClaimTimelineStep[];
  notes: string | null;
  notesSupported: boolean;
}

export interface ClaimsResponse {
  success: boolean;
  merchants?: { id: string; name: string }[];
  selectedMerchantId?: string;
  claims?: ClaimRecord[];
  message?: string;
}

export async function fetchClaims(merchantId?: string): Promise<ClaimsResponse> {
  const query = merchantId ? `?merchantId=${encodeURIComponent(merchantId)}` : "";
  const res = await fetch(`/api/claims${query}`, { cache: "no-store" });
  return res.json();
}

export async function saveClaimNotes(
  claimId: string,
  notes: string
): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`/api/claims/${claimId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });
  return res.json();
}
