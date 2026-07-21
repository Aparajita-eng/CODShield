import {
  Controller, Get, Post, Body, Param, UseGuards, ForbiddenException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { ReqSession } from "../auth/session.decorator";
import { resolveActiveMerchantId, handleMerchantScopeError } from "../../lib/merchantAccess";
import { PrismaService } from "../prisma/prisma.service";
import { ShipmentWorkflowService } from "../workflow/shipment-workflow.service";

@ApiTags("Shipments")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("api/shipments")
export class ShipmentController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shipmentWorkflow: ShipmentWorkflowService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List all shipments for the merchant" })
  async list(@ReqSession() session: any) {
    const scope = await resolveActiveMerchantId(session);
    if (!scope.ok) return handleMerchantScopeError(scope);
    const merchantId = scope.merchantId;

    const shipments = await this.prisma.shipment.findMany({
      where: { order: { merchantId } },
      include: { order: { include: { shippingAddress: true, buyer: true } } },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, shipments };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single shipment by ID" })
  async get(@ReqSession() session: any, @Param("id") id: string) {
    const scope = await resolveActiveMerchantId(session);
    if (!scope.ok) return handleMerchantScopeError(scope);
    const merchantId = scope.merchantId;

    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: { order: { include: { shippingAddress: true, buyer: true } } },
    });
    if (!shipment || shipment.order.merchantId !== merchantId) {
      throw new ForbiddenException("Unauthorized");
    }
    return { success: true, shipment };
  }

  @Post("orders/:orderId/dispatch")
  @ApiOperation({ summary: "Dispatch shipment for an order" })
  async dispatch(@Param("orderId") orderId: string, @Body() body: any) {
    const shipment = await this.shipmentWorkflow.dispatchShipment(orderId, body.courier);
    return { success: true, shipment };
  }

  @Post(":id/status")
  @ApiOperation({ summary: "Update shipment tracking status" })
  async updateStatus(
    @ReqSession() session: any,
    @Param("id") id: string,
    @Body() body: any
  ) {
    const scope = await resolveActiveMerchantId(session);
    if (!scope.ok) return handleMerchantScopeError(scope);
    const merchantId = scope.merchantId;

    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: { order: true },
    });
    if (!shipment || shipment.order.merchantId !== merchantId) {
      throw new ForbiddenException("Unauthorized");
    }

    const updates = (shipment.trackingUpdates as any[] || []);
    updates.push({ status: body.status, timestamp: new Date().toISOString() });

    const updated = await this.prisma.shipment.update({
      where: { id },
      data: { status: body.status, trackingUpdates: updates },
    });
    return { success: true, shipment: updated };
  }
}
