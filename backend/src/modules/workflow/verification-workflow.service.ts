import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLogService } from "../audit/audit.service";
import { randomUUID } from "crypto";

/**
 * VerificationWorkflowService
 *
 * Detects merchant capabilities and routes to:
 * - Merchant WhatsApp/Voice API (if connected)
 * - CODShield WhatsApp/Voice fallback (if not)
 *
 * State Machine: VERIFICATION_PENDING -> VERIFIED | REJECTED | MANUAL_REVIEW
 */
@Injectable()
export class VerificationWorkflowService {
  private readonly logger = new Logger(VerificationWorkflowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async triggerVerification(orderId: string, correlationId?: string): Promise<void> {
    const corrId = correlationId || randomUUID();

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shippingAddress: true, buyer: true },
    });

    if (!order) return;

    // Detect merchant capabilities
    const whatsappIntegration = await this.prisma.serviceIntegration.findFirst({
      where: {
        merchantId: order.merchantId,
        type: "WHATSAPP",
        status: "CONNECTED",
      },
    });

    const voiceIntegration = await this.prisma.serviceIntegration.findFirst({
      where: {
        merchantId: order.merchantId,
        type: "AI_VOICE",
        status: "CONNECTED",
      },
    });

    const settings = await this.prisma.merchantSettings.findUnique({
      where: { merchantId: order.merchantId },
    });

    let provider = "CODSHIELD";
    let verificationType = "WHATSAPP";

    if (whatsappIntegration) {
      provider = whatsappIntegration.provider;
      verificationType = "WHATSAPP";
    } else if (voiceIntegration) {
      provider = voiceIntegration.provider;
      verificationType = "AI_VOICE";
    } else if (settings?.fallbackVerification) {
      provider = "CODSHIELD";
      verificationType = "WHATSAPP";
    }

    // Create verification job
    const job = await this.prisma.verificationJob.create({
      data: {
        orderId,
        type: verificationType,
        status: "QUEUED",
      },
    });

    // Update order stage
    await this.prisma.order.update({
      where: { id: orderId },
      data: { currentStage: "WHATSAPP", verificationStatus: "PENDING" },
    });

    await this.prisma.orderEvent.create({
      data: {
        orderId,
        eventName: "VerificationRequestedEvent",
        description: `Verification requested via ${provider} (${verificationType}) [Job: ${job.id}]`,
      },
    });

    await this.auditLog.log({
      merchantId: order.merchantId,
      correlationId: corrId,
      action: "VERIFICATION_TRIGGERED",
      details: JSON.stringify({ provider, verificationType, jobId: job.id }),
      entityType: "ORDER",
      entityId: orderId,
      source: "VERIFICATION_WORKFLOW",
    });

    this.logger.log(`Verification triggered for order ${orderId} via ${provider}`);

    // In Demo Mode: auto-simulate a positive response after a short delay
    if (process.env.CODSHIELD_DEMO_MODE === "true") {
      setTimeout(async () => {
        await this.simulateVerificationCallback(orderId, job.id, "CONFIRMED", corrId);
      }, 3000);
    }
  }

  async simulateVerificationCallback(
    orderId: string,
    jobId: string,
    result: "CONFIRMED" | "REJECTED" | "NO_RESPONSE",
    correlationId?: string
  ): Promise<void> {
    const corrId = correlationId || randomUUID();
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) return;

    const newVerificationStatus = result === "CONFIRMED" ? "VERIFIED" : result === "REJECTED" ? "REJECTED" : "MANUAL_REVIEW";
    const newStage = result === "CONFIRMED" ? "DECISION" : "AI_CALL";

    await this.prisma.verificationJob.update({
      where: { id: jobId },
      data: { status: result === "CONFIRMED" ? "SUCCESS" : "FAILED" },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { verificationStatus: newVerificationStatus as any, currentStage: newStage as any },
    });

    await this.prisma.orderEvent.create({
      data: {
        orderId,
        eventName: "VerificationCompletedEvent",
        description: `Customer response: ${result} | Status: ${newVerificationStatus}`,
      },
    });

    await this.auditLog.log({
      merchantId: order.merchantId,
      correlationId: corrId,
      action: "VERIFICATION_COMPLETED",
      details: JSON.stringify({ result, newVerificationStatus }),
      entityType: "ORDER",
      entityId: orderId,
      source: "VERIFICATION_WORKFLOW",
    });
  }
}
