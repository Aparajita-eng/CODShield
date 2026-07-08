import { Request, Response } from "express";
import { prisma } from "../lib/db";
import { calculateRisk } from "../lib/risk";

export async function checkOrderRisk(req: Request, res: Response): Promise<any> {
  try {
    // 1. Authenticate Merchant via API Key
    const apiKey = req.headers["x-api-key"] as string | undefined;
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Provide x-api-key header."
      });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { apiKey },
    });

    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: "Invalid API key provided"
      });
    }

    // 2. Parse Request Body
    const { phone, pincode, value } = req.body;

    if (!phone || !pincode || value === undefined) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing: phone, pincode, and value are required"
      });
    }

    const orderValue = parseFloat(value);
    if (isNaN(orderValue) || orderValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid numeric order value is required"
      });
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
    return res.json({
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
    return res.status(500).json({
      success: false,
      message: "Internal server error occurred"
    });
  }
}
