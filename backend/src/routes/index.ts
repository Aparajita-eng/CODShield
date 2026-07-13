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
  processSimulatedClaim,
  createSandboxOrderRiskCheck,
} from "../controllers/sandboxController";
import {
  updateCompanySettings,
  regenerateApiKey,
  updatePassword,
  listTeamMembers,
  getWebhookSettings,
  updateWebhookSettings,
} from "../controllers/settingsController";
import { getDashboardData, submitClaim } from "../controllers/dashboardController";
import { listClaims, updateClaimNotes } from "../controllers/claimsController";
import { getFraudTrustGraph } from "../controllers/trustGraphController";
import { getPincodeIntelligence, getPincodeDetail } from "../controllers/pincodeController";
import { listFraudEvents } from "../controllers/fraudEventsController";
import { requireSession } from "../middleware/requireSession";
import { checkOrderRisk } from "../controllers/v1Controller";
import { getAnalyticsData } from "../controllers/analyticsController";

const router = Router();

// OTP verification dispatches
router.post("/otp/send", sendOtp);
router.post("/otp/verify", verifyOtp);

// Auth session endpoints
router.post("/auth/login", loginWithPassword);
router.post("/auth/register", registerAccount);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/otp-session", createOtpSession);

// Orders (session required)
router.get("/orders", requireSession, listOrders);
router.get("/orders/:orderId", requireSession, getOrderById);
router.patch("/orders/bulk", requireSession, bulkUpdateOrders);

// Customer intelligence (session required)
router.get("/customers", requireSession, listCustomers);
router.get("/customers/search", requireSession, searchCustomers);
router.get("/customers/profile", requireSession, getCustomerProfile);

// Pincode intelligence (session required)
router.get("/pincodes/intelligence", requireSession, getPincodeIntelligence);
router.get("/pincodes/:pincode/detail", requireSession, getPincodeDetail);

// Fraud events (session required)
router.get("/fraud/events", requireSession, listFraudEvents);

// Fraud / trust graph (session required)
router.get("/fraud/trust-graph", requireSession, getFraudTrustGraph);

// Sandbox simulation endpoints
router.post("/sandbox/trust-graph", evaluateTrustGraph);
router.post("/sandbox/risk-engine", checkRiskEngine);
router.post("/sandbox/pincode", checkPincode);
router.post("/sandbox/fraud-history", checkFraudHistory);
router.post("/sandbox/merchant-ratio", checkMerchantRatio);
router.post("/sandbox/claim", processSimulatedClaim);

// Settings (session required)
router.patch("/settings/company", requireSession, updateCompanySettings);
router.post("/settings/api-key/regenerate", requireSession, regenerateApiKey);
router.post("/settings/password", requireSession, updatePassword);
router.get("/settings/team", requireSession, listTeamMembers);
router.get("/settings/webhooks", requireSession, getWebhookSettings);
router.post("/settings/webhooks", requireSession, updateWebhookSettings);

// Sandbox simulator risk-check (session required)
router.post("/sandbox/orders/risk-check", requireSession, createSandboxOrderRiskCheck);

// Dashboard data endpoints (session required)
router.get("/dashboard/data", requireSession, getDashboardData);
router.post("/dashboard/claim-submit", requireSession, submitClaim);

// Claims (session required)
router.get("/claims", requireSession, listClaims);
router.post("/claims/:claimId/notes", requireSession, updateClaimNotes);

// Analytics (session required)
router.get("/analytics", requireSession, getAnalyticsData);

// Public versioned APIs (Merchant checkouts)
router.post("/v1/orders/risk-check", checkOrderRisk);

export default router;
