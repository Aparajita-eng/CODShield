import { Controller, Post, Body, HttpCode, HttpStatus, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { randomBytes } from 'crypto';
import { passwordResetStore } from '../../lib/passwordResetStore';
import { otpStore } from '../../lib/otpStore';
import { signSessionToken, signRefreshToken, verifyRefreshToken } from '../../lib/auth';
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('api/auth/login')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Successful login' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Post('api/auth/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new merchant account' })
  @ApiResponse({ status: 201, description: 'Account created' })
  @ApiResponse({ status: 409, description: 'Conflict: user or merchant already exists' })
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('api/auth/logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate session' })
  async logout() {
    return { success: true, message: 'Logged out successfully' };
  }

  @Post('api/auth/forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body() body: any) {
    const { email } = body;
    if (!email?.trim()) {
      return { success: false, message: "Email is required" };
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

  @Post('api/otp/send')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP SMS to a phone number' })
  async sendOtp(@Body() body: any) {
    const { phone } = body;

    if (!phone || phone.trim().length < 10) {
      return {
        success: false,
        message: "Valid 10-digit phone number is required"
      };
    }

    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    // B-11: reset attempt counter on every new send
    otpStore.set(phone.trim(), { code: rawCode, expiresAt, attempts: 0 });

    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("+")) {
      if (formattedPhone.length === 10) {
        formattedPhone = `+91${formattedPhone}`;
      } else {
        formattedPhone = `+${formattedPhone}`;
      }
    }

    const twoFactorApiKey = process.env.TWOFACTOR_API_KEY;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    let realSmsSent = false;
    let smsError = "";
    let providerName = "";

    if (twoFactorApiKey) {
      providerName = "2Factor";
      try {
        const cleanPhone = formattedPhone.replace("+", "");
        const twoFactorRes = await fetch(
          `https://2factor.in/API/V1/${twoFactorApiKey}/SMS/${cleanPhone}/${rawCode}`,
          { method: "GET" }
        );

        const twoFactorData = (await twoFactorRes.json()) as any;
        if (twoFactorRes.ok && twoFactorData.Status === "Success") {
          realSmsSent = true;
        } else {
          smsError = twoFactorData.Details || "2Factor returned an error";
        }
      } catch (err: any) {
        smsError = err.message || "2Factor network connection error";
      }
    } else if (accountSid && authToken && fromNumber) {
      providerName = "Twilio";
      try {
        const bodyParams = new URLSearchParams();
        bodyParams.append("To", formattedPhone);
        bodyParams.append("From", fromNumber);
        bodyParams.append("Body", `Your CODShield Verification Code is: ${rawCode}. Valid for 5 minutes.`);

        const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Authorization": authHeader,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: bodyParams.toString(),
          }
        );

        if (twilioRes.ok) {
          realSmsSent = true;
        } else {
          const twilioData = (await twilioRes.json()) as any;
          smsError = twilioData.message || "Twilio failed to dispatch message";
        }
      } catch (err: any) {
        smsError = err.message || "Twilio connection network error";
      }
    }

    return {
      success: true,
      message: realSmsSent
        ? `Real OTP dispatched to ${formattedPhone} via ${providerName}.`
        : `Simulated OTP sent to ${phone} via SMS and WhatsApp (SMS keys not configured).`,
      code: realSmsSent ? undefined : rawCode,
      simulated: !realSmsSent,
      error: smsError || undefined,
    };
  }

  @Post('api/otp/verify')
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

    const submittedCode = code.trim();
    const MAX_ATTEMPTS = 3;

    // Dev/test bypass: if DEV_OTP_BYPASS is set in env and the submitted code matches, always accept.
    const bypassCode = process.env.DEV_OTP_BYPASS;
    if (bypassCode && submittedCode === bypassCode) {
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

    otpStore.delete(phone.trim());

    return {
      success: true,
      message: "Phone number verified. Buyer intent confirmed."
    };
  }

  @Post('api/auth/otp-session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create session for OTP-verified user' })
  async createOtpSession(@Body() body: any) {
    const { phone, rememberMe = true } = body;

    if (!phone?.trim()) {
      return {
        success: false,
        message: "Phone number is required",
      };
    }

    const normalizedPhone = phone.trim();
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

  // B-15: Rotate refresh token → issue new short-lived access token
  @Post('api/auth/refresh')
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

    // Issue new short-lived access token + rotated refresh token
    const sessionPayload = { sub: payload.sub, email: payload.email, phone: payload.phone, name: payload.name, authType: payload.authType };
    const newAccessToken = await signSessionToken(sessionPayload);
    const newRefreshToken = await signRefreshToken(sessionPayload);

    return {
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
