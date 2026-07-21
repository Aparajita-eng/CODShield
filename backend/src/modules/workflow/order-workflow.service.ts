import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RiskEngineService } from "../risk/risk.service";
import { RulesEngineService } from "../rules/rules.service";
import { AuditLogService } from "../audit/audit.service";
import { WorkerService } from "../worker/worker.service";
import { randomUUID } from "crypto";

/**
 * OrderWorkflowService
 *
 * Handles the order ingestion & idempotency workflow:
 *   Order Imported -> Risk Calculated -> Rules Evaluated -> (Verification or Next Stage)
 *
 * State Machine: IMPORTED -> RISKED -> RULES_EVALUATED -> VERIFICATION_PENDING
 */
@Injectable()
export class OrderWorkflowService {
  private readonly logger = new Logger(OrderWorkflowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly riskEngine: RiskEngineService,
    private readonly rulesEngine: RulesEngineService,
    private readonly auditLog: AuditLogService,
    private readonly worker: WorkerService,
  ) {}

  /**
   * Trigger the full order processing workflow after import.
   * This is idempotent — safe to call multiple times for the same order.
   */
  async processOrder(orderId: string, correlationId?: string): Promise<void> {
    const corrId = correlationId || randomUUID();
    
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shippingAddress: true,
        buyer: true,
        items: true,
      },
    });

    if (!order) {
      this.logger.error(`Order ${orderId} not found`);
      return;
    }

    // Skip if already past the IMPORTED stage
    if (order.currentStage !== "IMPORTED") {
      this.logger.log(`Order ${orderId} already processed (stage: ${order.currentStage}), skipping.`);
      return;
    }

    await this.auditLog.log({
      merchantId: order.merchantId,
      correlationId: corrId,
      action: "ORDER_WORKFLOW_STARTED",
      details: `Processing started for order ${order.externalOrderId}`,
      entityType: "ORDER",
      entityId: orderId,
      source: "WORKFLOW_ENGINE",
    });

    // Step 1: Risk Assessment
    await this.runRiskAssessment(order, corrId);

    // Step 2: Rules Evaluation — enqueue to worker
    this.worker.enqueue("rules-queue", { orderId, correlationId: corrId });
  }

  private async runRiskAssessment(order: any, corrId: string): Promise<void> {
    const phone = order.buyer?.phone || order.phone || "";
    const pincode = order.shippingAddress?.pincode || order.pincode || "";

    try {
      const assessment = await this.riskEngine.calculateRisk(
        phone,
        pincode,
        order.value,
        undefined,
        order.buyer?.email,
        undefined,
        order.merchantId,
      );

      // Persist RiskAssessment
      await this.prisma.riskAssessment.create({
        data: {
          orderId: order.id,
          buyerScore: assessment.pincodeRisk,
          pincodeScore: assessment.pincodeRisk,
          velocityScore: 0,
          deviceScore: 0,
          fraudScore: assessment.phoneRisk,
          decision: this.mapActionToDecision(assessment.action),
        },
      });

      // Update order with risk score and move to next stage
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          riskScore: assessment.score,
          currentStage: "TRUST_SCORE",
        },
      });

      await this.prisma.orderEvent.create({
        data: {
          orderId: order.id,
          eventName: "RiskAssessmentCompletedEvent",
          description: `Risk score: ${assessment.score} | Verdict: ${assessment.verdict} | Action: ${assessment.action}`,
        },
      });

      await this.auditLog.log({
        merchantId: order.merchantId,
        correlationId: corrId,
        action: "RISK_ASSESSMENT_COMPLETED",
        details: JSON.stringify({ score: assessment.score, verdict: assessment.verdict, action: assessment.action }),
        entityType: "ORDER",
        entityId: order.id,
        source: "RISK_ENGINE",
      });
    } catch (err: any) {
      this.logger.error(`Risk assessment failed for order ${order.id}: ${err.message}`);
      await this.prisma.orderEvent.create({
        data: {
          orderId: order.id,
          eventName: "RiskAssessmentFailed",
          description: err.message,
        },
      });
    }
  }

  private mapActionToDecision(action: string): any {
    const map: Record<string, string> = {
      ALLOW_COD: "ALLOW_COD",
      OTP_REQUIRED: "OTP_REQUIRED",
      PREPAID_ONLY: "PREPAID_ONLY",
      REJECT_ORDER: "BLOCK_ORDER",
    };
    return map[action] || "ALLOW_COD";
  }
}
