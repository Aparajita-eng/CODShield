import { Response } from "express";
import {
  createClaimForOrder,
  fetchClaimByOrderId,
  fetchClaimsForMerchant,
  fetchMerchants,
  fetchMerchantById,
  fetchOrderById,
  fetchOrders,
} from "../lib/dataAccess";
import {
  assertSessionMerchantAccess,
  getMerchantIdsForSession,
} from "../lib/merchantAccess";
import { AuthenticatedRequest } from "../middleware/requireSession";

export async function getDashboardData(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const session = req.session!;
    const requestedMerchantId = req.query.merchantId as string | undefined;
    const allowedMerchantIds = await getMerchantIdsForSession(session);

    if (!allowedMerchantIds.length) {
      return res.status(403).json({
        success: false,
        message: "No merchant account linked to this user",
      });
    }

    const allMerchants = await fetchMerchants();
    const merchants = allMerchants.filter((m) => allowedMerchantIds.includes(m.id));

    if (!merchants.length) {
      return res.json({
        success: false,
        message: "No merchants found for this account.",
      });
    }

    const selectedMerchantId = requestedMerchantId || allowedMerchantIds[0];
    const access = await assertSessionMerchantAccess(session, selectedMerchantId);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const selectedMerchant = await fetchMerchantById(selectedMerchantId);

    if (!selectedMerchant) {
      return res.status(404).json({
        success: false,
        message: "Selected merchant not found",
      });
    }

    const orders = await fetchOrders({
      where: { merchantId: selectedMerchantId },
      orderBy: { createdAt: "desc" },
    });

    const claims = await fetchClaimsForMerchant(selectedMerchantId);

    const totalOrdersCount = orders.length;
    const protectedOrdersCount = orders.filter((o) => o.protectionStatus === "Protected").length;
    const heldOrdersCount = orders.filter((o) => o.protectionStatus === "Held").length;
    const failedOrdersCount = orders.filter((o) => o.protectionStatus === "Failed").length;

    const holdRatio = totalOrdersCount > 0 ? (heldOrdersCount / totalOrdersCount) * 100 : 0;
    const protectionRatio = totalOrdersCount > 0 ? (protectedOrdersCount / totalOrdersCount) * 100 : 0;

    const sanitizedMerchants = merchants.map(({ apiKeyHash, apiKeyMask, ...rest }) => rest);
    const { apiKeyHash, apiKeyMask, ...selectedMerchantRest } = selectedMerchant;

    return res.json({
      success: true,
      merchants: sanitizedMerchants,
      selectedMerchant: selectedMerchantRest,
      orders,
      claims,
      metrics: {
        totalOrders: totalOrdersCount,
        protectedOrders: protectedOrdersCount,
        heldOrders: heldOrdersCount,
        failedOrders: failedOrdersCount,
        holdRatio: parseFloat(holdRatio.toFixed(1)),
        protectionRatio: parseFloat(protectionRatio.toFixed(1)),
        claimRatio: selectedMerchantRest.claimRatio,
      },
    });
  } catch (error) {
    console.error("Dashboard data API error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred",
    });
  }
}

export async function submitClaim(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const session = req.session!;
    const { orderId, proofUrl } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required to submit a claim",
      });
    }

    const order = await fetchOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Associated order not found in logs",
      });
    }

    const access = await assertSessionMerchantAccess(session, order.merchantId);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const existingClaim = await fetchClaimByOrderId(orderId);

    if (existingClaim) {
      return res.json({
        success: false,
        message: "A claim has already been registered for this order",
      });
    }

    const claim = await createClaimForOrder(
      orderId,
      proofUrl || "https://dispatch.courier/returns/proof-of-refusal.pdf"
    );

    return res.json({
      success: true,
      claimId: claim.id,
      message: "Insurance claim registered successfully",
    });
  } catch (error) {
    console.error("Dashboard claim submit error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred",
    });
  }
}
