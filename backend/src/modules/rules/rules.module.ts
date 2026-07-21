import { Module } from "@nestjs/common";
import { RulesEngineService } from "./rules.service";
import { RulesController } from "./rules.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [RulesEngineService],
  controllers: [RulesController],
  exports: [RulesEngineService],
})
export class RulesModule {}
