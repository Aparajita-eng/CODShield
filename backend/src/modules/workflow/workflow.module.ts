import { Module } from "@nestjs/common";
import { OrderWorkflowService } from "./order-workflow.service";
import { VerificationWorkflowService } from "./verification-workflow.service";
import { ShipmentWorkflowService } from "./shipment-workflow.service";
import { WorkflowController } from "./workflow.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { RiskModule } from "../risk/risk.module";
import { RulesModule } from "../rules/rules.module";
import { AuditModule } from "../audit/audit.module";
import { WorkerModule } from "../worker/worker.module";

@Module({
  imports: [PrismaModule, RiskModule, RulesModule, AuditModule, WorkerModule],
  providers: [OrderWorkflowService, VerificationWorkflowService, ShipmentWorkflowService],
  controllers: [WorkflowController],
  exports: [OrderWorkflowService, VerificationWorkflowService, ShipmentWorkflowService],
})
export class WorkflowModule {}
