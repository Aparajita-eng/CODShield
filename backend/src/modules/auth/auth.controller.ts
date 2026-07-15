import { Controller, Post, Body, HttpCode, HttpStatus, Req, Res, UseGuards, UnauthorizedException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { randomBytes, createHash } from 'crypto';
import { otpStore } from '../../lib/otpStore';
import { signSessionToken, signRefreshToken, verifyRefreshToken } from '../../lib/auth';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { sendMail } from '../../lib/mailer';
import { isDemoDataMode } from '../../lib/demoData';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from './public.decorator';

export const demoVerifiedPhones = new Map<string, number>(); // phone -> expiresAt timestamp
export const demoOtpAttempts = new Map<string, { count: number; firstAttemptAt: number }>();
export const passwordResetStore = new Map<string, { email: string; expiresAt: number }>(); // key is hashed token

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function normalizePhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return digits;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(-10);
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

@ApiTags('Authentication')
@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('api/auth/login')
  @Public()
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Successful login' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Post('api/auth/register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new merchant account' })
  @ApiResponse({ status: 201, description: 'Account created' })
  @ApiResponse({ status: 409, description: 'Conflict: user or merchant already exists' })
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('api/auth/logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate session' })
  async logout() {
    return { success: true, message: 'Logged out successfully' };
  }

  @Post('api/auth/forgot-password')
  @Public()
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body() body: any) {
    const { email } = body;
    if (!email?.trim()) {
      return { success: false, message: "Email is required" };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const token = randomBytes(32).toString("hex");

    if (isDemoDataMode()) {
      await this.storeResetToken(normalizedEmail, token, "demo-user");
    } else {
      let user;
      try {
        user = await this.prisma.user.findUnique({
          where: { email: normalizedEmail }
        });
      } catch (error) {
        throw new ServiceUnavailableException("Database unavailable. Please try again later.");
      }
      if (!user) {
        // Prevent email enumeration
        return {
          success: true,
          message: "If the email is registered, a password reset link has been sent.",
          simulated: true,
        };
      }
      await this.storeResetToken(normalizedEmail, token, user.id);
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetLink = `${frontendUrl}/forgot-password?token=${token}`;

    let emailSent = false;
    try {
      const result = await sendMail({
        from: process.env.RESET_EMAIL_FROM || process.env.BOOKING_EMAIL_FROM || `CODShield <${process.env.SMTP_USER || 'noreply@codshield.com'}>`,
        to: normalizedEmail,
        subject: 'Reset your CODShield password',
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 30 minutes.</p>`,
      });
      emailSent = (result as any)?.success === true && !(result as any)?.simulated;
    } catch (err) {
      console.error('Password reset email error:', err);
    }

    if (!emailSent) {
      console.log(`[DEV] Password reset link for ${normalizedEmail}: ${resetLink}`);
      return {
        success: true,
        message: "Password reset link generated (dev mode — check server logs).",
        simulated: true,
        devResetLink: resetLink,
      };
    }

    return {
      success: true,
      message: "Password reset email sent",
      simulated: false,
    };
  }

  @Post('api/auth/reset-password')
  @Public()
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token' })
  async resetPassword(@Body() body: any) {
    const { token, newPassword } = body;
    if (!token?.trim() || !newPassword) {
      throw new BadRequestException("Token and new password are required");
    }

    const email = await this.consumeResetToken(token);
    await this.authService.resetPassword(email, newPassword);

    return {
      success: true,
      message: "Password reset successful"
    };
  }

  @Post('api/otp/send')
  @Public()
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP voice call to a phone number' })
  async sendOtp(@Body() body: any) {
    const { phone } = body;

    if (!phone || phone.trim().length < 10) {
      return {
        success: false,
        message: "Valid 10-digit phone number is required"
      };
    }

    // Enforce OTP rate limiting (max 5 attempts per phone per 15 mins)
    await this.checkAndIncrementOtpAttempts(phone);

    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    // B-11: reset attempt counter on every new send; B-09: reset in-progress flag
    otpStore.set(phone.trim(), { code: rawCode, expiresAt, attempts: 0, verifyingInProgress: false });

    const bypassCode = process.env.DEV_OTP_BYPASS;
    const twoFactorApiKey = process.env.TWOFACTOR_API_KEY?.trim();
    const shouldUse2Factor = Boolean(twoFactorApiKey);

    let realOtpSent = false;
    let dispatchError = "";

    const formattedPhone = normalizePhoneDigits(phone.trim());

    if (shouldUse2Factor) {
      try {
        const voiceEndpoint = process.env.TWOFACTOR_VOICE_ENDPOINT?.trim()
          || `https://2factor.in/API/V1/${twoFactorApiKey}/VOICE/${formattedPhone}/${rawCode}`;

        const twoFactorRes = await fetch(voiceEndpoint, { method: "GET" });
        const responseText = await twoFactorRes.text();

        if (!twoFactorRes.ok) {
          dispatchError = responseText || `2Factor voice call failed with status ${twoFactorRes.status}`;
        } else {
          realOtpSent = true;
        }
      } catch (err: any) {
        dispatchError = err.message || "2Factor connection network error";
      }
    }

    if (shouldUse2Factor && !realOtpSent) {
      return {
        success: false,
        message: dispatchError || "Failed to dispatch OTP voice call",
      };
    }

    if (!shouldUse2Factor && bypassCode && bypassCode.trim().length > 0) {
      return {
        success: true,
        message: `Simulated OTP sent to ${phone}.`,
        code: rawCode,
        simulated: true,
      };
    }

    return {
      success: true,
      message: `OTP voice call dispatched to ${formattedPhone}.`,
      code: undefined,
      simulated: false,
      error: undefined,
    };
  }

  @Post('api/otp/verify')
  @Public()
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code' })
  async verifyOtp(@Body() body: any) {
    const { phone, code } = body;

    if (!phone || !code) {
      return {
        success: false,
        message: "Phone number and verification code are required"
      };
    }

    // Enforce OTP rate limiting (max 5 attempts per phone per 15 mins)
    await this.checkAndIncrementOtpAttempts(phone);

    const submittedCode = code.trim();
    const MAX_ATTEMPTS = 3;

    const bypassCode = process.env.DEV_OTP_BYPASS;
    const shouldAllowBypass = !process.env.TWOFACTOR_API_KEY?.trim() && bypassCode && bypassCode.trim().length > 0;
    if (shouldAllowBypass && submittedCode === bypassCode) {
      await this.addVerifiedPhone(phone.trim());
      return {
        success: true,
        message: "Phone number verified (bypass mode)."
      };
    }

    const record = otpStore.get(phone.trim());

    if (!record) {
      return {
        success: false,
        message: "No verification request found for this phone number"
      };
    }

    // B-09: Prevent double-submit
    if (record.verifyingInProgress) {
      return {
        success: false,
        message: "Verification already in progress. Please wait a moment."
      };
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(phone.trim());
      return {
        success: false,
        message: "Verification code has expired. Please request a new one."
      };
    }

    // B-11: enforce max attempt limit
    if (record.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(phone.trim());
      return {
        success: false,
        message: "Too many incorrect attempts. Please request a new code."
      };
    }

    if (record.code !== submittedCode) {
      // Increment attempt counter
      record.attempts += 1;
      const remaining = MAX_ATTEMPTS - record.attempts;
      return {
        success: false,
        message: remaining > 0
          ? `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : "Too many incorrect attempts. Please request a new code."
      };
    }

    // B-09: Mark as verifying in progress before deleting
    record.verifyingInProgress = true;
    otpStore.delete(phone.trim());
    await this.addVerifiedPhone(phone.trim());

    return {
      success: true,
      message: "Phone number verified. Buyer intent confirmed."
    };
  }

  @Post('api/auth/otp-session')
  @Public()
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create session for OTP-verified user' })
  async createOtpSession(@Body() body: any) {
    const { phone, rememberMe = true } = body;

    if (!phone?.trim()) {
      throw new BadRequestException("Phone number is required");
    }

    const normalizedPhone = phone.trim();
    const isVerified = await this.consumeVerifiedPhone(normalizedPhone);
    if (!isVerified) {
      throw new BadRequestException("Phone number not verified. Please verify OTP first.");
    }

    const sessionPayload = { sub: `otp:${normalizedPhone}`, phone: normalizedPhone, authType: "otp" as const };
    const token = await signSessionToken(sessionPayload);
    const refreshToken = await signRefreshToken(sessionPayload);

    return {
      success: true,
      message: "Session created",
      token,
      refreshToken,
    };
  }

  @Post('api/auth/refresh')
  @Public()
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange a valid refresh token for a new access + refresh token pair' })
  async refresh(@Body() body: any) {
    const { refreshToken } = body;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const sessionPayload = { sub: payload.sub, email: payload.email, phone: payload.phone, name: payload.name, authType: payload.authType };
    const newAccessToken = await signSessionToken(sessionPayload);
    const newRefreshToken = await signRefreshToken(sessionPayload);

    return {
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  // --- Security Helper Methods ---

  private async checkAndIncrementOtpAttempts(phone: string): Promise<void> {
    const normalizedPhone = phone.trim();
    if (isDemoDataMode()) {
      const now = Date.now();
      const record = demoOtpAttempts.get(normalizedPhone);
      if (!record) {
        demoOtpAttempts.set(normalizedPhone, { count: 1, firstAttemptAt: now });
        return;
      }
      if (now - record.firstAttemptAt > 15 * 60 * 1000) {
        demoOtpAttempts.set(normalizedPhone, { count: 1, firstAttemptAt: now });
        return;
      }
      if (record.count >= 5) {
        throw new BadRequestException("Too many OTP attempts. Please try again after 15 minutes.");
      }
      record.count += 1;
    } else {
      try {
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        // Concurrency-safe atomic cleanup of expired record
        await this.prisma.otpAttempt.deleteMany({
          where: { phone: normalizedPhone, firstAttemptAt: { lt: fifteenMinsAgo } }
        });
        // Atomic increment / upsert to prevent read-then-write race conditions
        const record = await this.prisma.otpAttempt.upsert({
          where: { phone: normalizedPhone },
          create: { phone: normalizedPhone, attempts: 1, firstAttemptAt: new Date() },
          update: { attempts: { increment: 1 } }
        });
        if (record.attempts > 5) {
          throw new BadRequestException("Too many OTP attempts. Please try again after 15 minutes.");
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new ServiceUnavailableException("Database unavailable. Please try again later.");
      }
    }
  }

  private async addVerifiedPhone(phone: string): Promise<void> {
    const normalizedPhone = phone.trim();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes TTL
    if (isDemoDataMode()) {
      const now = Date.now();
      for (const [ph, exp] of demoVerifiedPhones.entries()) {
        if (now > exp) {
          demoVerifiedPhones.delete(ph);
        }
      }
      demoVerifiedPhones.set(normalizedPhone, expiresAt.getTime());
    } else {
      try {
        await this.prisma.verifiedPhone.deleteMany({
          where: { expiresAt: { lt: new Date() } }
        });
        await this.prisma.verifiedPhone.upsert({
          where: { phone: normalizedPhone },
          update: { expiresAt },
          create: { phone: normalizedPhone, expiresAt }
        });
      } catch (error) {
        throw new ServiceUnavailableException("Database unavailable. Please try again later.");
      }
    }
  }

  private async consumeVerifiedPhone(phone: string): Promise<boolean> {
    const normalizedPhone = phone.trim();
    if (isDemoDataMode()) {
      const expiresAt = demoVerifiedPhones.get(normalizedPhone);
      if (!expiresAt) return false;
      demoVerifiedPhones.delete(normalizedPhone);
      if (Date.now() > expiresAt) {
        return false;
      }
      return true;
    } else {
      try {
        const record = await this.prisma.verifiedPhone.findUnique({
          where: { phone: normalizedPhone }
        });
        if (!record) return false;
        await this.prisma.verifiedPhone.delete({
          where: { phone: normalizedPhone }
        });
        if (Date.now() > record.expiresAt.getTime()) {
          return false;
        }
        return true;
      } catch (error) {
        throw new ServiceUnavailableException("Database unavailable. Please try again later.");
      }
    }
  }

  private async storeResetToken(email: string, token: string, userId: string): Promise<void> {
    const hashed = hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    if (isDemoDataMode()) {
      passwordResetStore.set(hashed, { email, expiresAt: expiresAt.getTime() });
    } else {
      try {
        await this.prisma.passwordResetToken.create({
          data: { tokenHash: hashed, userId, expiresAt }
        });
      } catch (error) {
        throw new ServiceUnavailableException("Database unavailable. Please try again later.");
      }
    }
  }

  private async consumeResetToken(token: string): Promise<string> {
    const hashed = hashToken(token);
    if (isDemoDataMode()) {
      const entry = passwordResetStore.get(hashed);
      if (!entry) {
        throw new BadRequestException("Invalid or expired token");
      }
      passwordResetStore.delete(hashed);
      if (Date.now() > entry.expiresAt) {
        throw new BadRequestException("Token expired");
      }
      return entry.email;
    } else {
      try {
        const record = await this.prisma.passwordResetToken.findUnique({
          where: { tokenHash: hashed }
        });
        if (!record) {
          throw new BadRequestException("Invalid or expired token");
        }
        await this.prisma.passwordResetToken.delete({
          where: { tokenHash: hashed }
        });
        if (Date.now() > record.expiresAt.getTime()) {
          throw new BadRequestException("Token expired");
        }
        const user = await this.prisma.user.findUnique({
          where: { id: record.userId }
        });
        if (!user) {
          throw new BadRequestException("User not found");
        }
        return user.email;
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new ServiceUnavailableException("Database unavailable. Please try again later.");
      }
    }
  }
}
