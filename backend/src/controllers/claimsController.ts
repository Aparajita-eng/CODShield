import { Response } from "express";
import {
  fetchClaimsForMerchant,
  fetchMerchants,
  fetchClaimById,
  updateClaimNotesInDb,
} from "../lib/dataAccess";
import { mapClaimsForMerchant } from "../lib/claimsView";
import { resolveActiveMerchantId, assertSessionMerchantAccess } from "../lib/merchantAccess";
import { AuthenticatedRequest } from "../middleware/requireSession";

export async function listClaims(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const scope = await resolveActiveMerchantId(
      req.session!,
      req.query.merchantId as string | undefined
    );
    if (!scope.ok) {
      return res.status(scope.status).json({ success: false, message: scope.message });
    }

    const allMerchants = await fetchMerchants();
    const merchants = allMerchants.filter((m) => scope.allowedIds.includes(m.id));

    const claims = await fetchClaimsForMerchant(scope.merchantId);
    const items = mapClaimsForMerchant(claims, merchants, scope.merchantId);

    return res.json({
      success: true,
      merchants,
      selectedMerchantId: scope.merchantId,
      claims: items,
    });
  } catch (error) {
    console.error("List claims error:", error);
    return res.status(500).json({ success: false, message: "Failed to load claims" });
  }
}

export async function updateClaimNotes(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const { claimId } = req.params;
    const { notes } = req.body;

    if (notes === undefined || typeof notes !== "string") {
      return res.status(400).json({ success: false, message: "Valid notes content is required" });
    }

    const claim = await fetchClaimById(claimId);
    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    // Verify merchant access
    const access = await assertSessionMerchantAccess(req.session!, claim.order.merchantId);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const updatedClaim = await updateClaimNotesInDb(claimId, notes);
    if (!updatedClaim) {
      return res.status(500).json({ success: false, message: "Failed to save claim notes" });
    }

    return res.json({
      success: true,
      message: "Merchant notes updated successfully",
      notes: updatedClaim.notes,
    });
  } catch (error) {
    console.error("Update claim notes error:", error);
    return res.status(500).json({ success: false, message: "Failed to update claim notes" });
  }
}
