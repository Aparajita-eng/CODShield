import { Module } from "@nestjs/common";
import { ShipmentController } from "./shipment.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { WorkflowModule } from "../workflow/workflow.module";

@Module({
  imports: [PrismaModule, WorkflowModule],
  controllers: [ShipmentController],
})
export class ShipmentModule {}
