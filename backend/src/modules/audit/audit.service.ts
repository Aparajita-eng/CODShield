import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    merchantId: string;
    correlationId: string;
    action: string;
    details: string;
    entityType: string;
    entityId: string;
    version?: number;
    performedBy?: string;
    source: string;
  }): Promise<any> {
    try {
      const audit = await this.prisma.auditLog.create({
        data: {
          merchantId: params.merchantId,
          correlationId: params.correlationId,
          action: params.action,
          details: params.details,
          entityType: params.entityType,
          entityId: params.entityId,
          version: params.version ?? 1,
          performedBy: params.performedBy ?? "SYSTEM",
          source: params.source,
        },
      });
      return audit;
    } catch (err) {
      console.error("Failed to write audit log:", err);
    }
  }

  async getLogs(merchantId: string, correlationId?: string, entityId?: string) {
    const where: any = { merchantId };
    if (correlationId) where.correlationId = correlationId;
    if (entityId) where.entityId = entityId;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }
}
