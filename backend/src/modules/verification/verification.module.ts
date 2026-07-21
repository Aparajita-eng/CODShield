import { Module } from "@nestjs/common";
import { VerificationController } from "./verification.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { WorkflowModule } from "../workflow/workflow.module";

@Module({
  imports: [PrismaModule, WorkflowModule],
  controllers: [VerificationController],
})
export class VerificationModule {}
