import { Injectable, BadRequestException } from '@nestjs/common';
import { calculateRisk } from '../../lib/risk';
import { fetchPincodeRisk, fetchBlacklistByPhone } from '../../lib/dataAccess';
import { isDemoDataMode, demoOrders } from '../../lib/demoData';
import { prisma } from '../../lib/db';

@Injectable()
export class SandboxService {
  evaluateTrustGraph(body: any) {
    const { phone, address } = body;
    if (!phone || !address) {
      throw new BadRequestException("Phone and address are required");
    }

    const h = this.hashStr(phone + address);
    const score = 40 + (h % 56);
    const connections = h % 12;

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

    return {
      score,
      verdict,
      color,
      statusClass,
      connections,
    };
  }

  async checkRiskEngine(body: any) {
    const { phone, pincode, value } = body;
    if (!phone || !pincode || value === undefined) {
      throw new BadRequestException("Phone, pincode, and order value are required");
    }

    const orderValue = parseFloat(value);
    if (isNaN(orderValue) || orderValue < 0) {
      throw new BadRequestException("Valid numeric order value is required");
    }

    const assessment = await calculateRisk(
      phone.trim(),
      pincode.trim(),
      orderValue
    );

    return {
      assessment,
    };
  }

  async checkPincode(body: any) {
    const { pincode } = body;
    if (!pincode || pincode.trim().length !== 6) {
      throw new BadRequestException("Valid 6-digit pincode is required");
    }

    const pin = pincode.trim();
    const pinRecord = await fetchPincodeRisk(pin);

    const weight = pinRecord ? pinRecord.riskWeight : 0.25;
    const h = this.hashStr(pin);

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

    return {
      pincode: pin,
      weight,
      rto,
      accept,
      level,
      color,
    };
  }

  async checkFraudHistory(body: any) {
    const { phone } = body;
    if (!phone || phone.trim().length < 10) {
      throw new BadRequestException("Valid 10-digit phone number is required");
    }

    const key = phone.trim();
    const blacklistRecord = await fetchBlacklistByPhone(key);

    if (!blacklistRecord) {
      return {
        flagged: false,
        message: "Clear - no historical fraud or refusal records found on this identity",
        flags: [],
      };
    }

    const flags = [blacklistRecord.reason];
    if (blacklistRecord.refusalCount >= 3) {
      flags.push(`High refusal density detected (refusal ratio: ${(blacklistRecord.refusalCount * 25).toFixed(0)}%)`);
      flags.push("Identity matching multiple merchant delivery blacklists");
    } else {
      flags.push("Address consistency checks passing but delivery delivery cancelled post-dispatch");
    }

    return {
      flagged: true,
      refusalCount: blacklistRecord.refusalCount,
      message: `Identity flagged: ${blacklistRecord.refusalCount} previous refusal records found`,
      flags,
    };
  }

  checkMerchantRatio(body: any) {
    const { ratio } = body;
    if (ratio === undefined) {
      throw new BadRequestException("Claim ratio is required");
    }

    const claimRatio = parseFloat(ratio);
    if (isNaN(claimRatio) || claimRatio < 0 || claimRatio > 100) {
      throw new BadRequestException("Valid claim ratio between 0% and 100% is required");
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

    return {
      score,
      tier,
      color,
      dotClass,
      description,
    };
  }

  processSimulatedClaim(body: any) {
    const { orderId } = body;
    if (!orderId) {
      throw new BadRequestException("Order ID is required");
    }

    return {
      orderId,
      steps: [
        { name: "Proof uploaded", status: "completed", message: "Delivery refusal documentation registered" },
        { name: "Courier verified", status: "completed", message: "Logistics API status confirmed as RTO" },
        { name: "AI fraud check", status: "completed", message: "No collusive patterns or merchant manipulation detected" },
        { name: "Payout approved", status: "completed", message: "Disbursement of ₹1,850 credited to balance" }
      ]
    };
  }

  async createSandboxOrderRiskCheck(merchantId: string, body: any) {
    const { phone, pincode, value } = body;
    if (!phone || !pincode || value === undefined) {
      throw new BadRequestException("Required fields missing: phone, pincode, and value are required");
    }

    const orderValue = parseFloat(value);
    if (isNaN(orderValue) || orderValue < 0) {
      throw new BadRequestException("Valid numeric order value is required");
    }

    const assessment = await calculateRisk(phone.trim(), pincode.trim(), orderValue);

    let protectionStatus = "Protected";
    if (assessment.action === "OTP_REQUIRED") {
      protectionStatus = "Held";
    } else if (assessment.action === "PREPAID_ONLY" || assessment.action === "REJECT_ORDER") {
      protectionStatus = "Failed";
    }

    const saveOrder = async () => {
      if (isDemoDataMode()) {
        const order = {
          id: `b0000000-0000-4000-8000-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
          merchantId,
          phone: phone.trim(),
          pincode: pincode.trim(),
          value: orderValue,
          riskScore: assessment.score,
          protectionStatus,
          fulfillmentStatus: "Pending",
          fraudFlagged: false,
          statusReason: assessment.reasons.slice(0, 3).join(", "),
          createdAt: new Date(),
        };
        demoOrders.unshift(order);
        return order;
      }
      return prisma.order.create({
        data: {
          merchantId,
          phone: phone.trim(),
          pincode: pincode.trim(),
          value: orderValue,
          riskScore: assessment.score,
          protectionStatus,
          statusReason: assessment.reasons.slice(0, 3).join(", "),
        },
      });
    };

    const order = await saveOrder();

    return {
      orderId: order.id,
      riskAssessment: {
        score: assessment.score,
        action: assessment.action,
        reasons: assessment.reasons,
      },
    };
  }

  private hashStr(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }
}
