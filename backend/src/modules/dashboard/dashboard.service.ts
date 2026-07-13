import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  createClaimForOrder,
  fetchClaimByOrderId,
  fetchClaimsForMerchant,
  fetchMerchants,
  fetchMerchantById,
  fetchOrderById,
  fetchOrders,
} from '../../lib/dataAccess';
import { assertSessionMerchantAccess, getMerchantIdsForSession } from '../../lib/merchantAccess';

@Injectable()
export class DashboardService {
  async getDashboardData(session: any, requestedMerchantId?: string) {
    const allowedMerchantIds = await getMerchantIdsForSession(session);

    if (!allowedMerchantIds.length) {
      throw new ForbiddenException("No merchant account linked to this user");
    }

    const allMerchants = await fetchMerchants();
    const merchants = allMerchants.filter((m) => allowedMerchantIds.includes(m.id));

    if (!merchants.length) {
      return {
        success: false,
        message: "No merchants found for this account.",
      };
    }

    const selectedMerchantId = requestedMerchantId || allowedMerchantIds[0];
    const access = await assertSessionMerchantAccess(session, selectedMerchantId);
    if (!access.ok) {
      throw new ForbiddenException(access.message);
    }

    const selectedMerchant = await fetchMerchantById(selectedMerchantId);
    if (!selectedMerchant) {
      throw new NotFoundException("Selected merchant not found");
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

    return {
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
    };
  }

  async submitClaim(session: any, body: any) {
    const { orderId, proofUrl } = body;
    if (!orderId) {
      throw new BadRequestException("Order ID is required to submit a claim");
    }

    const order = await fetchOrderById(orderId);
    if (!order) {
      throw new NotFoundException("Associated order not found in logs");
    }

    const access = await assertSessionMerchantAccess(session, order.merchantId);
    if (!access.ok) {
      throw new ForbiddenException(access.message);
    }

    const existingClaim = await fetchClaimByOrderId(orderId);
    if (existingClaim) {
      return {
        success: false,
        message: "A claim has already been registered for this order",
      };
    }

    const claim = await createClaimForOrder(
      orderId,
      proofUrl || "https://dispatch.courier/returns/proof-of-refusal.pdf"
    );

    return {
      success: true,
      claimId: claim.id,
      message: "Insurance claim registered successfully",
    };
  }
}
