import { prisma } from "./db";

export interface RiskAssessment {
  score: number; // 0 to 100
  verdict: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  action: "ALLOW_COD" | "OTP_REQUIRED" | "PREPAID_ONLY" | "REJECT_ORDER";
  reasons: string[];
  pincodeRisk: number;
  valueRisk: number;
  phoneRisk: number;
}

export async function calculateRisk(
  phone: string,
  pincode: string,
  value: number
): Promise<RiskAssessment> {
  const reasons: string[] = [];

  // 1. Fetch Pincode Risk Weight
  const pinRecord = await prisma.pincodeRisk.findUnique({
    where: { pincode },
  });
  const pincodeRiskWeight = pinRecord ? pinRecord.riskWeight : 0.25; // default moderate risk
  if (pinRecord) {
    if (pincodeRiskWeight > 0.6) {
      reasons.push("Delivery pincode is flagged as a high RTO zone");
    } else if (pincodeRiskWeight < 0.2) {
      reasons.push("Delivery pincode is a verified low RTO zone");
    }
  } else {
    reasons.push("Pincode is unrated, applied baseline regional weight");
  }

  // 2. Fetch Phone Blacklist History
  const blacklistRecord = await prisma.blacklist.findUnique({
    where: { phone },
  });
  const refusalCount = blacklistRecord ? blacklistRecord.refusalCount : 0;
  const phoneRiskFactor = Math.min(1.0, refusalCount / 3.0);
  if (refusalCount > 0) {
    reasons.push(`Phone number has a record of ${refusalCount} historical delivery refusals`);
  } else {
    reasons.push("No historical fraud or refusal records found for this phone number");
  }

  // 3. Calculate Order Value Factor (capped at 15000 INR)
  const valueRiskFactor = Math.min(1.0, value / 15000.0);
  if (value > 8000) {
    reasons.push("High order value increases financial exposure risk");
  } else if (value < 1500) {
    reasons.push("Low order value reduces financial impact of possible RTO");
  }

  // 4. Calculate Final Weighted Score
  // W1 (Pincode) = 40, W2 (Value) = 30, W3 (Phone) = 30
  const pincodeContribution = pincodeRiskWeight * 40.0;
  const valueContribution = valueRiskFactor * 30.0;
  const phoneContribution = phoneRiskFactor * 30.0;

  let rawScore = pincodeContribution + valueContribution + phoneContribution;
  
  // Ensure realistic margins
  let score = Math.round(rawScore);
  score = Math.max(5, Math.min(98, score));

  // Determine Verdict and Action
  let verdict: RiskAssessment["verdict"] = "LOW";
  let action: RiskAssessment["action"] = "ALLOW_COD";

  if (score < 30) {
    verdict = "LOW";
    action = "ALLOW_COD";
  } else if (score < 60) {
    verdict = "MEDIUM";
    action = "OTP_REQUIRED";
    reasons.push("Medium risk score triggers mandatory OTP verification to confirm buyer intent");
  } else if (score < 80) {
    verdict = "HIGH";
    action = "PREPAID_ONLY";
    reasons.push("High risk score indicates high likelihood of RTO. Restrict to prepaid payments");
  } else {
    verdict = "CRITICAL";
    action = "REJECT_ORDER";
    reasons.push("Critical risk assessment. Automated rejection to prevent inventory and shipping loss");
  }

  return {
    score,
    verdict,
    action,
    reasons,
    pincodeRisk: Math.round(pincodeContribution),
    valueRisk: Math.round(valueContribution),
    phoneRisk: Math.round(phoneContribution),
  };
}
