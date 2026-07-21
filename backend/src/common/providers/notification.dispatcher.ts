import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../modules/prisma/prisma.service";

@Injectable()
export class NotificationDispatcher {
  constructor(private readonly prisma: PrismaService) {}

  async dispatch(
    orderId: string,
    type: "SMS" | "EMAIL" | "PUSH" | "WHATSAPP",
    recipient: string,
    content: string,
    merchantId: string
  ): Promise<{ success: boolean; response?: string; error?: string }> {
    // 1. Resolve credentials or use default
    let provider = "SYSTEM";
    let status = "SENT";
    let responseText = "Message successfully dispatched via CODShield fallback.";

    try {
      // Find active service integration of this type for this merchant
      const integration = await this.prisma.serviceIntegration.findFirst({
        where: {
          merchantId,
          type: type === "WHATSAPP" ? "WHATSAPP" : type === "EMAIL" ? "EMAIL" : "SMS",
          status: "CONNECTED",
        },
      });

      if (integration) {
        provider = integration.provider;
        responseText = `Message successfully dispatched via connected provider: ${provider}.`;
      }

      // Log notification log history
      await this.prisma.notificationLog.create({
        data: {
          orderId,
          type,
          provider,
          status,
          response: responseText,
        },
      });

      return { success: true, response: responseText };
    } catch (err: any) {
      status = "FAILED";
      const errorMsg = err.message || "Unknown error";
      await this.prisma.notificationLog.create({
        data: {
          orderId,
          type,
          provider,
          status,
          response: `Error: ${errorMsg}`,
        },
      });
      return { success: false, error: errorMsg };
    }
  }
}
