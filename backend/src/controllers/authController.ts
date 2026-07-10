import { randomBytes } from "crypto";
import { Request, Response } from "express";
import { prisma } from "../lib/db";
import {
  hashPassword,
  signSessionToken,
  verifyPassword,
  SESSION_TTL_LONG,
  SESSION_TTL_SHORT,
} from "../lib/auth";
import { passwordResetStore } from "../lib/passwordResetStore";

const DEMO_EMAIL = (process.env.DEMO_USER_EMAIL || "demo@codshield.com").toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || "Demo@1234";

function generateApiKey(companyName: string): string {
  const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 12);
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `codshield_live_${slug}_${suffix}`;
}

async function issueSession(
  res: Response,
  payload: Parameters<typeof signSessionToken>[0],
  rememberMe = true
) {
  const token = await signSessionToken(payload, rememberMe ? SESSION_TTL_LONG : SESSION_TTL_SHORT);
  return token;
}

async function issueDemoUserSession(res: Response, rememberMe = true) {
  const token = await issueSession(
    res,
    {
      sub: "demo-user",
      email: DEMO_EMAIL,
      name: "Demo Merchant",
      authType: "password",
    },
    rememberMe
  );

  return res.json({
    success: true,
    message: "Logged in successfully",
    token,
    user: {
      id: "demo-user",
      email: DEMO_EMAIL,
      name: "Demo Merchant",
      companyName: "FastCommerce Inc.",
    },
  });
}

export async function loginWithPassword(req: Request, res: Response): Promise<any> {
  try {
    const { email, password, rememberMe = false } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === DEMO_EMAIL && password === DEMO_PASSWORD) {
      return issueDemoUserSession(res, rememberMe);
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (user && verifyPassword(password, user.passwordHash)) {
        const token = await issueSession(
          res,
          {
            sub: user.id,
            email: user.email,
            name: user.name,
            authType: "password",
          },
          rememberMe
        );

        return res.json({
          success: true,
          message: "Logged in successfully",
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            companyName: user.companyName,
          },
        });
      }
    } catch (dbError) {
      console.warn("Database unavailable for login, demo credentials only:", dbError);
    }

    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  } catch (error) {
    console.error("Password login error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to log in",
    });
  }
}

export async function registerAccount(req: Request, res: Response): Promise<any> {
  try {
    const { fullName, email, companyName, password } = req.body;

    if (!fullName?.trim() || !email?.trim() || !companyName?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, company name, and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists",
        });
      }

      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: hashPassword(password),
          name: fullName.trim(),
          companyName: companyName.trim(),
        },
      });

      await prisma.merchant.create({
        data: {
          name: companyName.trim(),
          apiKey: generateApiKey(companyName),
          tier: "Starter",
          claimRatio: 0,
        },
      });

      const token = await issueSession(
        res,
        {
          sub: user.id,
          email: user.email,
          name: user.name,
          authType: "password",
        },
        true
      );

      return res.status(201).json({
        success: true,
        message: "Account created successfully",
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          companyName: user.companyName,
        },
      });
    } catch (dbError) {
      console.error("Register database error:", dbError);
      return res.status(503).json({
        success: false,
        message: "Registration requires a configured database. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ success: false, message: "Failed to create account" });
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<any> {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const token = randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 60 * 60 * 1000;
    passwordResetStore.set(token, { email: normalizedEmail, token, expiresAt });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetLink = `${frontendUrl}/forgot-password?token=${token}`;

    const resendApiKey = process.env.RESEND_API_KEY;
    let emailSent = false;

    if (resendApiKey) {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.RESET_EMAIL_FROM || "CODShield <noreply@codshield.com>",
            to: normalizedEmail,
            subject: "Reset your CODShield password",
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
          }),
        });
        emailSent = emailRes.ok;
      } catch (err) {
        console.error("Password reset email error:", err);
      }
    }

    if (!emailSent) {
      console.log(`[DEV] Password reset link for ${normalizedEmail}: ${resetLink}`);
      return res.json({
        success: true,
        message: "Password reset link generated (dev mode — check server logs).",
        simulated: true,
        devResetLink: resetLink,
      });
    }

    return res.json({
      success: true,
      message: "Password reset email sent",
      simulated: false,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ success: false, message: "Failed to process reset request" });
  }
}

export async function createOtpSession(req: Request, res: Response): Promise<any> {
  try {
    const { phone, rememberMe = true } = req.body;

    if (!phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const normalizedPhone = phone.trim();
    const token = await signSessionToken(
      {
        sub: `otp:${normalizedPhone}`,
        phone: normalizedPhone,
        authType: "otp",
      },
      rememberMe ? SESSION_TTL_LONG : SESSION_TTL_SHORT
    );

    return res.json({
      success: true,
      message: "Session created",
      token,
    });
  } catch (error) {
    console.error("OTP session error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create session",
    });
  }
}
