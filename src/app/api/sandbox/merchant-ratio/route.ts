import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { ratio } = await request.json();

    if (ratio === undefined) {
      return NextResponse.json(
        { success: false, message: "Claim ratio is required" },
        { status: 400 }
      );
    }

    const claimRatio = parseFloat(ratio);
    if (isNaN(claimRatio) || claimRatio < 0 || claimRatio > 100) {
      return NextResponse.json(
        { success: false, message: "Valid claim ratio between 0% and 100% is required" },
        { status: 400 }
      );
    }

    const score = Math.max(2, Math.round(100 - claimRatio * 4.5));
    let tier = "Trusted";
    let color = "text-risklow";
    let dotClass = "bg-risklow";
    let description = "Merchant displays excellent order metrics with low claim volume. Full authorization tier enabled.";

    if (claimRatio >= 10.0) {
      tier = "Restricted";
      color = "text-riskhigh";
      dotClass = "bg-riskhigh";
      description = "High claim ratio indicates potential abuse. Claims review holds enabled. Verification thresholds increased.";
    } else if (claimRatio >= 5.0) {
      tier = "Watch";
      color = "text-riskmid";
      dotClass = "bg-riskmid";
      description = "Elevated claim ratio detected. Manual audits active for order protection approvals.";
    }

    return NextResponse.json({
      success: true,
      score,
      tier,
      color,
      dotClass,
      description,
    });
  } catch (error) {
    console.error("Error evaluating merchant ratio:", error);
    return NextResponse.json(
      { success: false, message: "Failed to evaluate merchant ratio" },
      { status: 500 }
    );
  }
}
