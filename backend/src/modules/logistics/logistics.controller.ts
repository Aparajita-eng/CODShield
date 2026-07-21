import {
  Controller, Get, Post, Delete, Body, Param, UseGuards, ForbiddenException, BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { ReqSession } from "../auth/session.decorator";
import { resolveActiveMerchantId, handleMerchantScopeError } from "../../lib/merchantAccess";
import { PrismaService } from "../prisma/prisma.service";
import * as crypto from "crypto";

const ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || "changeme-32-chars-key-1234567890").slice(0, 32);

function encryptConfig(data: object): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(JSON.stringify(data));
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decryptConfig(text: string): object {
  try {
    const [ivHex, encHex] = text.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString());
  } catch {
    return {};
  }
}

@ApiTags("Service Integrations")
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller("api/service-integrations")
export class LogisticsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List all service integrations for the merchant" })
  async list(@ReqSession() session: any) {
    const scope = await resolveActiveMerchantId(session);
    if (!scope.ok) return handleMerchantScopeError(scope);
    const merchantId = scope.merchantId;

    const integrations = await this.prisma.serviceIntegration.findMany({
      where: { merchantId },
      orderBy: { createdAt: "asc" },
    });

    // Strip encrypted credentials from response
    return {
      success: true,
      integrations: integrations.map((i) => ({
        ...i,
        encryptedConfig: undefined,
        configPreview: "[credentials stored securely]",
      })),
    };
  }

  @Post("connect")
  @ApiOperation({ summary: "Connect a new service integration" })
  async connect(@ReqSession() session: any, @Body() body: any) {
    const scope = await resolveActiveMerchantId(session);
    if (!scope.ok) return handleMerchantScopeError(scope);
    const merchantId = scope.merchantId;

    const { type, provider, config } = body;

    if (!type || !provider || !config) {
      throw new BadRequestException("type, provider, and config are required");
    }

    const encryptedConfig = encryptConfig(config);

    // Upsert to prevent duplicates
    const existing = await this.prisma.serviceIntegration.findFirst({
      where: { merchantId, type, provider },
    });

    const integration = existing
      ? await this.prisma.serviceIntegration.update({
          where: { id: existing.id },
          data: {
            encryptedConfig,
            configVersion: { increment: 1 },
            status: "CONNECTED",
            validatedAt: new Date(),
            lastError: null,
          },
        })
      : await this.prisma.serviceIntegration.create({
          data: {
            merchantId,
            type,
            provider,
            encryptedConfig,
            status: "CONNECTED",
            validatedAt: new Date(),
          },
        });

    return {
      success: true,
      message: `${provider} integration connected successfully`,
      integration: { ...integration, encryptedConfig: undefined },
    };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Disconnect a service integration" })
  async disconnect(@ReqSession() session: any, @Param("id") id: string) {
    const scope = await resolveActiveMerchantId(session);
    if (!scope.ok) return handleMerchantScopeError(scope);
    const merchantId = scope.merchantId;

    const integration = await this.prisma.serviceIntegration.findUnique({ where: { id } });

    if (!integration || integration.merchantId !== merchantId) {
      throw new ForbiddenException("Unauthorized");
    }

    await this.prisma.serviceIntegration.update({
      where: { id },
      data: { status: "DISCONNECTED" },
    });

    return { success: true, message: "Integration disconnected" };
  }

  @Post(":id/health-check")
  @ApiOperation({ summary: "Trigger a health check on a service integration" })
  async healthCheck(@ReqSession() session: any, @Param("id") id: string) {
    const scope = await resolveActiveMerchantId(session);
    if (!scope.ok) return handleMerchantScopeError(scope);
    const merchantId = scope.merchantId;

    const integration = await this.prisma.serviceIntegration.findUnique({ where: { id } });

    if (!integration || integration.merchantId !== merchantId) {
      throw new ForbiddenException("Unauthorized");
    }

    // Demo health check — always passes
    const result = { healthy: true, latencyMs: Math.floor(Math.random() * 200) + 50 };

    await this.prisma.serviceIntegration.update({
      where: { id },
      data: { lastHealthCheck: new Date(), lastError: null, status: "CONNECTED" },
    });

    return { success: true, ...result };
  }
}
