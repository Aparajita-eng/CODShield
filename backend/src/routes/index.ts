import { Router } from "express";
import { sendOtp, verifyOtp } from "../controllers/otpController";
import {
  evaluateTrustGraph,
  checkRiskEngine,
  checkPincode,
  checkFraudHistory,
  checkMerchantRatio,
  processSimulatedClaim
} from "../controllers/sandboxController";
import { getDashboardData, submitClaim } from "../controllers/dashboardController";
import { checkOrderRisk } from "../controllers/v1Controller";

const router = Router();

// OTP verification dispatches
router.post("/otp/send", sendOtp);
router.post("/otp/verify", verifyOtp);

// Sandbox simulation endpoints
router.post("/sandbox/trust-graph", evaluateTrustGraph);
router.post("/sandbox/risk-engine", checkRiskEngine);
router.post("/sandbox/pincode", checkPincode);
router.post("/sandbox/fraud-history", checkFraudHistory);
router.post("/sandbox/merchant-ratio", checkMerchantRatio);
router.post("/sandbox/claim", processSimulatedClaim);

// Dashboard data endpoints
router.get("/dashboard/data", getDashboardData);
router.post("/dashboard/claim-submit", submitClaim);

// Public versioned APIs (Merchant checkouts)
router.post("/v1/orders/risk-check", checkOrderRisk);

export default router;
