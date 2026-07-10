import { Request, Response } from "express";
import { prisma } from "../lib/db";
import { signSessionToken, verifyPassword } from "../lib/auth";

const DEMO_EMAIL = (process.env.DEMO_USER_EMAIL || "demo@codshield.com").toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || "Demo@1234";

async function issueDemoUserSession(res: Response) {
  const token = await signSessionToken({
    sub: "demo-user",
    email: DEMO_EMAIL,
    name: "Demo Merchant",
    authType: "password",
  });

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
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === DEMO_EMAIL && password === DEMO_PASSWORD) {
      return issueDemoUserSession(res);
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (user && verifyPassword(password, user.passwordHash)) {
        const token = await signSessionToken({
          sub: user.id,
          email: user.email,
          name: user.name,
          authType: "password",
        });

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

export async function createOtpSession(req: Request, res: Response): Promise<any> {
  try {
    const { phone } = req.body;

    if (!phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const normalizedPhone = phone.trim();
    const token = await signSessionToken({
      sub: `otp:${normalizedPhone}`,
      phone: normalizedPhone,
      authType: "otp",
    });

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
