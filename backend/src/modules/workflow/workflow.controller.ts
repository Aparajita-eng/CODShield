import { Controller, Post, Body, Param, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { ReqSession } from "../auth/session.decorator";
import { resolveActiveMerchantId } from "../../lib/merchantAccess";
import { OrderWorkflowService } from "./order-workflow.service";
import { VerificationWorkflowService } from "./verification-workflow.service";
import { ShipmentWorkflowService } from "./shipment-workflow.service";

@ApiTags("Workflow Engine")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("api/workflow")
export class WorkflowController {
  constructor(
    private readonly orderWorkflow: OrderWorkflowService,
    private readonly verificationWorkflow: VerificationWorkflowService,
    private readonly shipmentWorkflow: ShipmentWorkflowService,
  ) {}

  @Post("orders/:orderId/process")
  @ApiOperation({ summary: "Trigger the order processing workflow (Risk + Rules)" })
  async processOrder(@Param("orderId") orderId: string) {
    await this.orderWorkflow.processOrder(orderId);
    return { success: true, message: "Order workflow triggered" };
  }

  @Post("orders/:orderId/verify")
  @ApiOperation({ summary: "Trigger verification workflow for an order" })
  async triggerVerification(@Param("orderId") orderId: string) {
    await this.verificationWorkflow.triggerVerification(orderId);
    return { success: true, message: "Verification triggered" };
  }

  @Post("orders/:orderId/verify/callback")
  @ApiOperation({ summary: "Receive verification callback result" })
  async verificationCallback(@Param("orderId") orderId: string, @Body() body: any) {
    await this.verificationWorkflow.simulateVerificationCallback(
      orderId,
      body.jobId,
      body.result || "CONFIRMED",
    );
    return { success: true, message: "Verification callback processed" };
  }

  @Post("orders/:orderId/recommend")
  @ApiOperation({ summary: "Generate logistics courier recommendations for an order" })
  async generateRecommendations(@Param("orderId") orderId: string) {
    await this.shipmentWorkflow.generateRecommendations(orderId);
    return { success: true, message: "Recommendations generated" };
  }

  @Post("orders/:orderId/dispatch")
  @ApiOperation({ summary: "Dispatch shipment for an approved order" })
  async dispatchShipment(@Param("orderId") orderId: string, @Body() body: any) {
    const shipment = await this.shipmentWorkflow.dispatchShipment(orderId, body.courier);
    return { success: true, shipment };
  }
}
