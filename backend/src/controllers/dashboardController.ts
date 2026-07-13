import { Request, Response } from "express";
import {
  createClaimForOrder,
  fetchClaimByOrderId,
  fetchClaimsForMerchant,
  fetchMerchants,
  fetchMerchantById,
  fetchOrderById,
  fetchOrders,
} from "../lib/dataAccess";

export async function getDashboardData(req: Request, res: Response): Promise<any> {
  try {
    const merchantId = req.query.merchantId as string | undefined;

    // Fetch all merchants to populate selection dropdown
    const merchants = await fetchMerchants();

    if (!merchants.length) {
      return res.json({
        success: false,
        message: "No merchants found in database. Run seeds first."
      });
    }

    // Default to the first merchant if none specified
    const selectedMerchantId = merchantId || merchants[0].id;
    const selectedMerchant = await fetchMerchantById(selectedMerchantId);

    if (!selectedMerchant) {
      return res.status(404).json({
        success: false,
        message: "Selected merchant not found"
      });
    }

    // Fetch orders for this merchant
    const orders = await fetchOrders({
      where: { merchantId: selectedMerchantId },
      orderBy: { createdAt: "desc" },
    });

    const claims = await fetchClaimsForMerchant(selectedMerchantId);

    // Calculate aggregated dashboard metrics
    const totalOrdersCount = orders.length;
    const protectedOrdersCount = orders.filter((o) => o.protectionStatus === "Protected").length;
    const heldOrdersCount = orders.filter((o) => o.protectionStatus === "Held").length;
    const failedOrdersCount = orders.filter((o) => o.protectionStatus === "Failed").length;

    const holdRatio = totalOrdersCount > 0 ? (heldOrdersCount / totalOrdersCount) * 100 : 0;
    const protectionRatio = totalOrdersCount > 0 ? (protectedOrdersCount / totalOrdersCount) * 100 : 0;

    return res.json({
      success: true,
      merchants,
      selectedMerchant,
      orders,
      claims,
      metrics: {
        totalOrders: totalOrdersCount,
        protectedOrders: protectedOrdersCount,
        heldOrders: heldOrdersCount,
        failedOrders: failedOrdersCount,
        holdRatio: parseFloat(holdRatio.toFixed(1)),
        protectionRatio: parseFloat(protectionRatio.toFixed(1)),
        claimRatio: selectedMerchant.claimRatio,
      },
    });
  } catch (error) {
    console.error("Dashboard data API error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred"
    });
  }
}

export async function submitClaim(req: Request, res: Response): Promise<any> {
  try {
    const { orderId, proofUrl } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required to submit a claim"
      });
    }

    const order = await fetchOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Associated order not found in logs"
      });
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
      message: "Internal server error occurred"
    });
  }
}
