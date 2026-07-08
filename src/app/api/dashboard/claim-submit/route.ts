import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { orderId, proofUrl } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required to submit a claim" },
        { status: 400 }
      );
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Associated order not found in logs" },
        { status: 404 }
      );
    }

    // Check if a claim already exists for this order
    const existingClaim = await prisma.claim.findFirst({
      where: { orderId },
    });

    if (existingClaim) {
      return NextResponse.json({
        success: false,
        message: "A claim has already been registered for this order",
      });
    }

    // Create a new claim starting at step 1
    const claim = await prisma.claim.create({
      data: {
        orderId,
        proofUrl: proofUrl || "https://dispatch.courier/returns/proof-of-refusal.pdf",
        status: "Pending",
        step: 1,
      },
    });

    return NextResponse.json({
      success: true,
      claimId: claim.id,
      message: "Insurance claim registered successfully",
    });
  } catch (error) {
    console.error("Dashboard claim submit error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error occurred" },
      { status: 500 }
    );
  }
}
