import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { fetchMerchantById, updateMerchantName, updateMerchantApiKey } from '../../lib/dataAccess';
import { hashPassword, verifyPassword, hashApiKey, maskApiKey } from '../../lib/auth';
import { isDemoDataMode } from '../../lib/demoData';

const webhookStore = new Map<string, { url: string; events: string[] }>();

@Injectable()
export class MerchantService {
  constructor(private readonly prisma: PrismaService) {}

  async updateCompany(merchantId: string, body: any) {
    const { name, contactEmail, businessAddress } = body;
    if (!name || name.trim() === "") {
      throw new BadRequestException("Company name is required");
    }

    const updated = await updateMerchantName(merchantId, name.trim());
    if (!updated) {
      throw new InternalServerErrorException("Failed to update company settings");
    }

    return {
      id: updated.id,
      name: updated.name,
      tier: updated.tier,
      contactEmail: contactEmail || "contact@acme.com",
      businessAddress: businessAddress || "123 Apparel Way, Bengaluru",
    };
  }

  async regenerateApiKey(merchantId: string) {
    const merchant = await fetchMerchantById(merchantId);
    if (!merchant) {
      throw new NotFoundException("Merchant not found");
    }

    const crypto = require("crypto");
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const slug = merchant.name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12) || "merchant";
    const rawKey = `codshield_live_${slug}_${crypto.randomBytes(8).toString("hex")}_${suffix}`;

    const hashed = hashApiKey(rawKey);
    const masked = maskApiKey(rawKey);

    await updateMerchantApiKey(merchantId, hashed, masked);

    return {
      apiKey: rawKey,
      apiKeyMask: masked,
    };
  }

  async updatePassword(session: any, body: any) {
    if (session.sub === "demo-user" || session.email === "demo@codshield.com") {
      throw new ForbiddenException("Password modifications are disabled for the demo account.");
    }

    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) {
      throw new BadRequestException("Current and new passwords are required");
    }

    if (newPassword.length < 6) {
      throw new BadRequestException("New password must be at least 6 characters long");
    }

    if (isDemoDataMode()) {
      return;
    }

    const user = await this.prisma.user.findUnique({ where: { id: session.sub } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      throw new BadRequestException("Incorrect current password");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(newPassword) },
    });
  }

  async listTeam(merchantId: string) {
    if (isDemoDataMode()) {
      return [
        {
          id: "demo-user",
          name: "Demo Merchant User",
          email: "demo@codshield.com",
          role: "Owner",
          createdAt: new Date("2025-06-01T00:00:00Z").toISOString(),
        },
      ];
    }

    const users = await this.prisma.user.findMany({
      where: { merchantId },
      orderBy: { createdAt: "asc" },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.email === "demo@codshield.com" ? "Owner" : "Administrator",
      createdAt: u.createdAt.toISOString(),
    }));
  }

  getWebhook(merchantId: string) {
    return webhookStore.get(merchantId) || {
      url: "",
      events: ["order.flagged", "claim.updated"],
    };
  }

  updateWebhook(merchantId: string, body: any) {
    const { url, events } = body;
    if (url === undefined || !Array.isArray(events)) {
      throw new BadRequestException("URL and events array are required");
    }

    const config = { url: url.trim(), events };
    webhookStore.set(merchantId, config);
    return config;
  }
}
