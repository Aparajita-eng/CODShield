import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get("merchantId");

    // Fetch all merchants to populate selection dropdown
    const merchants = await prisma.merchant.findMany();

    if (!merchants.length) {
      return NextResponse.json({
        success: false,
        message: "No merchants found in database. Run seeds first.",
      });
    }

    // Default to the first merchant if none specified
    const selectedMerchantId = merchantId || merchants[0].id;
    const selectedMerchant = await prisma.merchant.findUnique({
      where: { id: selectedMerchantId },
    });

    if (!selectedMerchant) {
      return NextResponse.json(
        { success: false, message: "Selected merchant not found" },
        { status: 404 }
      );
    }

    // Fetch orders for this merchant
    const orders = await prisma.order.findMany({
      where: { merchantId: selectedMerchantId },
      orderBy: { createdAt: "desc" },
    });

    // Fetch claims for this merchant's orders
    const claims = await prisma.claim.findMany({
      where: {
        order: {
          merchantId: selectedMerchantId,
        },
      },
      include: {
        order: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate aggregated dashboard metrics
    const totalOrdersCount = orders.length;
    const protectedOrdersCount = orders.filter((o) => o.protectionStatus === "Protected").length;
    const heldOrdersCount = orders.filter((o) => o.protectionStatus === "Held").length;
    const failedOrdersCount = orders.filter((o) => o.protectionStatus === "Failed").length;

    const holdRatio = totalOrdersCount > 0 ? (heldOrdersCount / totalOrdersCount) * 100 : 0;
    const protectionRatio = totalOrdersCount > 0 ? (protectedOrdersCount / totalOrdersCount) * 100 : 0;

    return NextResponse.json({
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
    return NextResponse.json(
      { success: false, message: "Internal server error occurred" },
      { status: 500 }
    );
  }
}
