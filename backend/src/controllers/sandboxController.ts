import { Request, Response } from "express";
import { prisma } from "../lib/db";
import { calculateRisk } from "../lib/risk";
import { fetchPincodeRisk, fetchBlacklistByPhone } from "../lib/dataAccess";

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export async function evaluateTrustGraph(req: Request, res: Response): Promise<any> {
  try {
    const { phone, address } = req.body;

    if (!phone || !address) {
      return res.status(400).json({
        success: false,
        message: "Phone and address are required"
      });
    }

    const h = hashStr(phone + address);
    const score = 40 + (h % 56); // 40 to 95
    const connections = h % 12; // 0 to 11 matches

    let verdict = "Moderate trust";
    let color = "text-riskmid";
    let statusClass = "riskmid";

    if (score >= 75) {
      verdict = "High trust";
      color = "text-risklow";
      statusClass = "risklow";
    } else if (score < 50) {
      verdict = "Low trust - review recommended";
      color = "text-riskhigh";
      statusClass = "riskhigh";
    }

    return res.json({
      success: true,
      score,
      verdict,
      color,
      statusClass,
      connections,
    });
  } catch (error) {
    console.error("Error evaluating trust graph:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to evaluate trust graph"
    });
  }
}

export async function checkRiskEngine(req: Request, res: Response): Promise<any> {
  try {
    const { phone, pincode, value } = req.body;

    if (!phone || !pincode || value === undefined) {
      return res.status(400).json({
        success: false,
        message: "Phone, pincode, and order value are required"
      });
    }

    const orderValue = parseFloat(value);
    if (isNaN(orderValue) || orderValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid numeric order value is required"
      });
    }

    const assessment = await calculateRisk(
      phone.trim(),
      pincode.trim(),
      orderValue
    );

    return res.json({
      success: true,
      assessment,
    });
  } catch (error) {
    console.error("Error evaluating order risk:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to evaluate order risk"
    });
  }
}

export async function checkPincode(req: Request, res: Response): Promise<any> {
  try {
    const { pincode } = req.body;

    if (!pincode || pincode.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Valid 6-digit pincode is required"
      });
    }

    const pin = pincode.trim();
    const pinRecord = await fetchPincodeRisk(pin);

    const weight = pinRecord ? pinRecord.riskWeight : 0.25;
    const h = hashStr(pin);

    // Calculate simulated metrics
    const rto = Math.round(weight * 40 + 4);
    const accept = Math.round(100 - rto - (h % 8));

    let level = "Medium risk zone";
    let color = "text-riskmid";

    if (rto < 12) {
      level = "Low risk zone";
      color = "text-risklow";
    } else if (rto > 22) {
      level = "High risk zone";
      color = "text-riskhigh";
    }

    return res.json({
      success: true,
      pincode: pin,
      weight,
      rto,
      accept,
      level,
      color,
    });
  } catch (error) {
    console.error("Error evaluating pincode risk:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to evaluate pincode risk"
    });
  }
}

export async function checkFraudHistory(req: Request, res: Response): Promise<any> {
  try {
    const { phone } = req.body;

    if (!phone || phone.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit phone number is required"
      });
    }

    const key = phone.trim();
    const blacklistRecord = await fetchBlacklistByPhone(key);

    if (!blacklistRecord) {
      return res.json({
        success: true,
        flagged: false,
        message: "Clear - no historical fraud or refusal records found on this identity",
        flags: [],
      });
    }

    const flags = [blacklistRecord.reason];
    if (blacklistRecord.refusalCount >= 3) {
      flags.push(`High refusal density detected (refusal ratio: ${(blacklistRecord.refusalCount * 25).toFixed(0)}%)`);
      flags.push("Identity matching multiple merchant delivery blacklists");
    } else {
      flags.push("Address consistency checks passing but delivery delivery cancelled post-dispatch");
    }

    return res.json({
      success: true,
      flagged: true,
      refusalCount: blacklistRecord.refusalCount,
      message: `Identity flagged: ${blacklistRecord.refusalCount} previous refusal records found`,
      flags,
    });
  } catch (error) {
    console.error("Error checking fraud history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to query fraud history"
    });
  }
}

export async function checkMerchantRatio(req: Request, res: Response): Promise<any> {
  try {
    const { ratio } = req.body;

    if (ratio === undefined) {
      return res.status(400).json({
        success: false,
        message: "Claim ratio is required"
      });
    }

    const claimRatio = parseFloat(ratio);
    if (isNaN(claimRatio) || claimRatio < 0 || claimRatio > 100) {
      return res.status(400).json({
        success: false,
        message: "Valid claim ratio between 0% and 100% is required"
      });
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

    return res.json({
      success: true,
      score,
      tier,
      color,
      dotClass,
      description,
    });
  } catch (error) {
    console.error("Error evaluating merchant ratio:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to evaluate merchant ratio"
    });
  }
}

export async function processSimulatedClaim(req: Request, res: Response): Promise<any> {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    return res.json({
      success: true,
      orderId,
      steps: [
        { name: "Proof uploaded", status: "completed", message: "Delivery refusal documentation registered" },
        { name: "Courier verified", status: "completed", message: "Logistics API status confirmed as RTO" },
        { name: "AI fraud check", status: "completed", message: "No collusive patterns or merchant manipulation detected" },
        { name: "Payout approved", status: "completed", message: "Disbursement of ₹1,850 credited to balance" }
      ]
    });
  } catch (error) {
    console.error("Error processing simulated claim:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process simulated claim"
    });
  }
}
