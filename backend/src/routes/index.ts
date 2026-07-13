import { Router } from "express";
import { sendOtp, verifyOtp } from "../controllers/otpController";
import { loginWithPassword, createOtpSession, registerAccount, forgotPassword } from "../controllers/authController";
import { listOrders, getOrderById, bulkUpdateOrders } from "../controllers/ordersController";
import {
  listCustomers,
  searchCustomers,
  getCustomerProfile,
} from "../controllers/customersController";
import {
  evaluateTrustGraph,
  checkRiskEngine,
  checkPincode,
  checkFraudHistory,
  checkMerchantRatio,
  processSimulatedClaim
} from "../controllers/sandboxController";
import { getDashboardData, submitClaim } from "../controllers/dashboardController";
import { getFraudTrustGraph } from "../controllers/trustGraphController";
import { getPincodeIntelligence, getPincodeDetail } from "../controllers/pincodeController";
import { listFraudEvents } from "../controllers/fraudEventsController";
import { requireSession } from "../middleware/requireSession";
import { checkOrderRisk } from "../controllers/v1Controller";

const router = Router();

// OTP verification dispatches
router.post("/otp/send", sendOtp);
router.post("/otp/verify", verifyOtp);

// Auth session endpoints
router.post("/auth/login", loginWithPassword);
router.post("/auth/register", registerAccount);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/otp-session", createOtpSession);

// Orders endpoints
router.get("/orders", listOrders);
router.get("/orders/:orderId", getOrderById);
router.patch("/orders/bulk", bulkUpdateOrders);

// Customer intelligence endpoints
router.get("/customers", listCustomers);
router.get("/customers/search", searchCustomers);
router.get("/customers/profile", getCustomerProfile);

// Pincode intelligence
router.get("/pincodes/intelligence", getPincodeIntelligence);
router.get("/pincodes/:pincode/detail", getPincodeDetail);

// Fraud events
router.get("/fraud/events", listFraudEvents);

// Fraud / trust graph (session required)
router.get("/fraud/trust-graph", requireSession, getFraudTrustGraph);

// Sandbox simulation endpoints
router.post("/sandbox/trust-graph", evaluateTrustGraph);
router.post("/sandbox/risk-engine", checkRiskEngine);
router.post("/sandbox/pincode", checkPincode);
router.post("/sandbox/fraud-history", checkFraudHistory);
router.post("/sandbox/merchant-ratio", checkMerchantRatio);
router.post("/sandbox/claim", processSimulatedClaim);

// Dashboard data endpoints (session required — see docs/SECURITY_FOLLOWUPS.md for other routes)
router.get("/dashboard/data", requireSession, getDashboardData);
router.post("/dashboard/claim-submit", requireSession, submitClaim);

// TODO(security): protect orders, customers, pincode, and fraud/events routes — see docs/SECURITY_FOLLOWUPS.md

// Public versioned APIs (Merchant checkouts)
router.post("/v1/orders/risk-check", checkOrderRisk);

export default router;
