import { Controller, Post, Get, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { VerificationWorkflowService } from "../workflow/verification-workflow.service";
import { ReqSession } from "../auth/session.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { resolveActiveMerchantId } from "../../lib/merchantAccess";

@ApiTags("Verification")
@ApiBearerAuth()
@Controller("api/verification")
export class VerificationController {
  constructor(
    private readonly verificationWorkflow: VerificationWorkflowService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(AuthGuard)
  @Post("orders/:orderId/trigger")
  @ApiOperation({ summary: "Manually trigger verification for an order" })
  async trigger(@Param("orderId") orderId: string) {
    await this.verificationWorkflow.triggerVerification(orderId);
    return { success: true, message: "Verification triggered" };
  }

  @Post("callback")
  @ApiOperation({ summary: "Receive verification callback (webhook endpoint)" })
  async callback(@Body() body: any) {
    const { orderId, jobId, result } = body;
    await this.verificationWorkflow.simulateVerificationCallback(orderId, jobId, result || "CONFIRMED");
    return { success: true, message: "Callback processed" };
  }

  @UseGuards(AuthGuard)
  @Get("orders/:orderId/jobs")
  @ApiOperation({ summary: "List verification jobs for an order" })
  async listJobs(@Param("orderId") orderId: string) {
    const jobs = await this.prisma.verificationJob.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, jobs };
  }
}
