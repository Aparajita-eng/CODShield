import { Response } from "express";
import { prisma } from "../lib/db";
import {
  fetchMerchantById,
  updateMerchantName,
  updateMerchantApiKey,
} from "../lib/dataAccess";
import { isDemoDataMode } from "../lib/demoData";
import { resolveActiveMerchantId, assertSessionMerchantAccess } from "../lib/merchantAccess";
import { AuthenticatedRequest } from "../middleware/requireSession";
import { hashPassword, verifyPassword, hashApiKey, maskApiKey } from "../lib/auth";

// In-memory store for webhook configs (scoped by merchantId)
const webhookStore = new Map<string, { url: string; events: string[] }>();

export async function updateCompanySettings(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const scope = await resolveActiveMerchantId(
      req.session!,
      req.body.merchantId as string | undefined
    );
    if (!scope.ok) {
      return res.status(scope.status).json({ success: false, message: scope.message });
    }

    const { name, contactEmail, businessAddress } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ success: false, message: "Company name is required" });
    }

    const updatedMerchant = await updateMerchantName(scope.merchantId, name.trim());
    if (!updatedMerchant) {
      return res.status(500).json({ success: false, message: "Failed to update company settings" });
    }

    return res.json({
      success: true,
      message: "Company settings updated successfully",
      merchant: {
        id: updatedMerchant.id,
        name: updatedMerchant.name,
        tier: updatedMerchant.tier,
        contactEmail: contactEmail || "contact@acme.com", // returned as echo (mock input)
        businessAddress: businessAddress || "123 Apparel Way, Bengaluru", // returned as echo (mock input)
      },
    });
  } catch (error) {
    console.error("Update company settings error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function regenerateApiKey(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const requestedMerchantId = req.body.merchantId as string | undefined;
    const scope = await resolveActiveMerchantId(req.session!, requestedMerchantId);
    if (!scope.ok) {
      return res.status(scope.status).json({ success: false, message: scope.message });
    }

    const merchantId = scope.merchantId;
    const merchant = await fetchMerchantById(merchantId);
    if (!merchant) {
      return res.status(404).json({ success: false, message: "Merchant not found" });
    }

    // Generate cryptographically secure API key
    const crypto = require("crypto");
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const slug = merchant.name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12) || "merchant";
    const rawKey = `codshield_live_${slug}_${crypto.randomBytes(8).toString("hex")}_${suffix}`;

    const hashed = hashApiKey(rawKey);
    const masked = maskApiKey(rawKey);

    await updateMerchantApiKey(merchantId, hashed, masked);

    // Return the plaintext key EXACTLY ONCE here
    return res.json({
      success: true,
      message: "API key regenerated successfully. Please copy it now as it will not be shown again.",
      apiKey: rawKey,
      apiKeyMask: masked,
    });
  } catch (error) {
    console.error("Regenerate API key error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function updatePassword(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const session = req.session!;
    
    // Test/Confirm error response for demo-user
    if (session.sub === "demo-user" || session.email === "demo@codshield.com") {
      return res.status(403).json({
        success: false,
        message: "Password modifications are disabled for the demo account.",
      });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current and new passwords are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters long" });
    }

    if (isDemoDataMode()) {
      return res.json({ success: true, message: "Password updated successfully (demo fallback)" });
    }

    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return res.status(400).json({ success: false, message: "Incorrect current password" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(newPassword) },
    });

    return res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Update password error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function listTeamMembers(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const scope = await resolveActiveMerchantId(
      req.session!,
      req.query.merchantId as string | undefined
    );
    if (!scope.ok) {
      return res.status(scope.status).json({ success: false, message: scope.message });
    }

    const merchantId = scope.merchantId;

    if (isDemoDataMode()) {
      return res.json({
        success: true,
        team: [
          {
            id: "demo-user",
            name: "Demo Merchant User",
            email: "demo@codshield.com",
            role: "Owner",
            createdAt: new Date("2025-06-01T00:00:00Z").toISOString(),
          },
        ],
      });
    }

    const users = await prisma.user.findMany({
      where: { merchantId },
      orderBy: { createdAt: "asc" },
    });

    return res.json({
      success: true,
      team: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.email === "demo@codshield.com" ? "Owner" : "Administrator",
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("List team members error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function getWebhookSettings(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const scope = await resolveActiveMerchantId(
      req.session!,
      req.query.merchantId as string | undefined
    );
    if (!scope.ok) {
      return res.status(scope.status).json({ success: false, message: scope.message });
    }

    const config = webhookStore.get(scope.merchantId) || {
      url: "",
      events: ["order.flagged", "claim.updated"],
    };

    return res.json({ success: true, webhook: config });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function updateWebhookSettings(req: AuthenticatedRequest, res: Response): Promise<any> {
  try {
    const scope = await resolveActiveMerchantId(
      req.session!,
      req.body.merchantId as string | undefined
    );
    if (!scope.ok) {
      return res.status(scope.status).json({ success: false, message: scope.message });
    }

    const { url, events } = req.body;
    if (url === undefined || !Array.isArray(events)) {
      return res.status(400).json({ success: false, message: "URL and events array are required" });
    }

    const config = { url: url.trim(), events };
    webhookStore.set(scope.merchantId, config);

    return res.json({
      success: true,
      message: "Webhook configuration saved successfully",
      webhook: config,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
