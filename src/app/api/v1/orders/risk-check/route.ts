import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateRisk } from "@/lib/risk";

export async function POST(request: Request) {
  try {
    // 1. Authenticate Merchant via API Key
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "Authentication required. Provide x-api-key header." },
        { status: 401 }
      );
    }

    const merchant = await prisma.merchant.findUnique({
      where: { apiKey },
    });

    if (!merchant) {
      return NextResponse.json(
        { success: false, message: "Invalid API key provided" },
        { status: 401 }
      );
    }

    // 2. Parse Request Body
    const body = await request.json().catch(() => ({}));
    const { phone, pincode, value } = body;

    if (!phone || !pincode || value === undefined) {
      return NextResponse.json(
        { success: false, message: "Required fields missing: phone, pincode, and value are required" },
        { status: 400 }
      );
    }

    const orderValue = parseFloat(value);
    if (isNaN(orderValue) || orderValue < 0) {
      return NextResponse.json(
        { success: false, message: "Valid numeric order value is required" },
        { status: 400 }
      );
    }

    // 3. Compute Risk Assessment
    const assessment = await calculateRisk(
      phone.trim(),
      pincode.trim(),
      orderValue
    );

    // Map risk assessment action to database Order protection status
    // Action types: "ALLOW_COD" | "OTP_REQUIRED" | "PREPAID_ONLY" | "REJECT_ORDER"
    // Protection statuses: "Protected", "Held", "Failed"
    let protectionStatus = "Protected";
    if (assessment.action === "OTP_REQUIRED") {
      protectionStatus = "Held";
    } else if (assessment.action === "PREPAID_ONLY" || assessment.action === "REJECT_ORDER") {
      protectionStatus = "Failed";
    }

    // 4. Save Order Log in DB for dashboard tracking
    const order = await prisma.order.create({
      data: {
        merchantId: merchant.id,
        phone: phone.trim(),
        pincode: pincode.trim(),
        value: orderValue,
        riskScore: assessment.score,
        protectionStatus,
        statusReason: assessment.reasons.slice(0, 3).join(", "),
      },
    });

    // 5. Send response
    return NextResponse.json({
      success: true,
      orderId: order.id,
      riskAssessment: {
        score: assessment.score,
        verdict: assessment.verdict,
        action: assessment.action,
        reasons: assessment.reasons,
      },
    });
  } catch (error) {
    console.error("Public API risk-check error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error occurred" },
      { status: 500 }
    );
  }
}
