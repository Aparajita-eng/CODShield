import { Module } from "@nestjs/common";
import { LogisticsController } from "./logistics.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [LogisticsController],
})
export class LogisticsModule {}
