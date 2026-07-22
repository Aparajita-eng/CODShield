import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, verifyPassword, signSessionToken, signRefreshToken, hashApiKey, maskApiKey } from '../../lib/auth';
import { isDemoDataMode, demoMerchants, DEMO_MERCHANT_ACME_ID } from '../../lib/demoData';

// Structured logging utility
function log(level: 'INFO' | 'ERROR' | 'WARN', message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, service: 'AuthService', message, ...meta };
  console.log(JSON.stringify(logEntry));
}

const DEMO_EMAIL = (process.env.DEMO_USER_EMAIL || "demo@codshield.com").toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || "Demo@1234";

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  companyName: string;
  passwordHash: string;
  phone?: string;
  role: string;
  merchantId?: string;
}

export const demoUsers = new Map<string, DemoUser>();

// Pre-populate with default demo user
demoUsers.set(DEMO_EMAIL, {
  id: 'demo-user',
  email: DEMO_EMAIL,
  name: 'Demo Merchant',
  companyName: 'FastCommerce Inc.',
  passwordHash: hashPassword(DEMO_PASSWORD),
  role: 'Owner',
  merchantId: DEMO_MERCHANT_ACME_ID,
});

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private async repairLegacyUser(userId: string, companyName?: string | null, userName?: string) {
    return await this.prisma.$transaction(async (tx) => {
      // Row lock FOR UPDATE to prevent race conditions across concurrent login attempts
      try {
        await tx.$queryRaw`
          SELECT id, "merchantId"
          FROM "User"
          WHERE id = ${userId}
          FOR UPDATE
        `;
      } catch (err) {
        log('WARN', 'Row lock query error during legacy user repair (proceeding with select)', { error: err instanceof Error ? err.message : String(err) });
      }

      const lockedUser = await tx.user.findUnique({ where: { id: userId } });
      if (!lockedUser) {
        throw new UnauthorizedException('User not found');
      }

      if (lockedUser.merchantId) {
        return lockedUser;
      }

      const company = companyName?.trim() || `${userName || 'User'}'s Store`;
      const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 12);
      const suffix = Math.floor(1000 + Math.random() * 9000);
      const rawApiKey = `codshield_live_${slug}_${suffix}`;
      const apiKeyHash = hashApiKey(rawApiKey);
      const apiKeyMask = maskApiKey(rawApiKey);

      const merchant = await tx.merchant.create({
        data: {
          name: company,
          apiKeyHash,
          apiKeyMask,
          tier: 'Starter',
          claimRatio: 0,
        }
      });

      await tx.merchantSettings.create({
        data: {
          merchantId: merchant.id,
          autoDispatch: false,
          enableCourierRecommendation: true,
          enableAIConfirmation: true,
          defaultCourier: 'SHIPROCKET',
          fallbackVerification: true,
          analyticsRealtime: true,
        }
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { merchantId: merchant.id }
      });

      log('INFO', 'Successfully repaired legacy user with new merchant', { userId, merchantId: merchant.id });
      return updatedUser;
    });
  }

  async login(body: any) {
    const { email, password, rememberMe = false } = body;
    if (!email?.trim() || !password) {
      log('WARN', 'Login attempt with missing credentials', { hasEmail: !!email, hasPassword: !!password });
      throw new UnauthorizedException('Email and password are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    log('INFO', 'Login attempt', { email: normalizedEmail, rememberMe });

    // Check in-memory demo users first if in demo mode
    if (isDemoDataMode()) {
      log('INFO', 'Using demo mode for login', { email: normalizedEmail });
      const demoUser = demoUsers.get(normalizedEmail);
      if (demoUser && verifyPassword(password, demoUser.passwordHash)) {
        if (!demoUser.merchantId) {
          demoUser.merchantId = DEMO_MERCHANT_ACME_ID;
        }
        const sessionPayload = { sub: demoUser.id, email: demoUser.email, name: demoUser.name, authType: 'password' as const, sessionKeyVerified: true };
        const token = await signSessionToken(sessionPayload);
        const refreshToken = await signRefreshToken(sessionPayload);
        log('INFO', 'Demo login successful', { email: normalizedEmail, userId: demoUser.id });
        return {
          success: true,
          message: "Logged in successfully",
          token,
          refreshToken,
          user: { id: demoUser.id, email: demoUser.email, name: demoUser.name, companyName: demoUser.companyName }
        };
      }
      log('WARN', 'Demo login failed - invalid credentials', { email: normalizedEmail });
    }

    try {
      let user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (user && verifyPassword(password, user.passwordHash)) {
        // Auto-repair legacy user if merchantId is null
        if (!user.merchantId) {
          log('INFO', 'Legacy user missing merchantId - repairing account on login', { userId: user.id });
          user = await this.repairLegacyUser(user.id, user.companyName, user.name);
        }

        const sessionPayload = { sub: user.id, email: user.email, name: user.name, authType: 'password' as const };
        const token = await signSessionToken(sessionPayload);
        const refreshToken = await signRefreshToken(sessionPayload);
        log('INFO', 'Login successful', { email: normalizedEmail, userId: user.id, companyName: user.companyName });
        return {
          success: true,
          message: "Logged in successfully",
          token,
          refreshToken,
          user: { id: user.id, email: user.email, name: user.name, companyName: user.companyName }
        };
      }
      log('WARN', 'Login failed - invalid credentials', { email: normalizedEmail, userFound: !!user });
    } catch (e) {
      log('ERROR', 'Database error during login', { email: normalizedEmail, error: e instanceof Error ? e.message : String(e) });
      console.warn("Prisma unavailable during login, fallback to demo mode:", e);
    }

    throw new UnauthorizedException('Invalid email or password');
  }

  async register(body: any) {
    const { fullName, companyName, email, password, phone, role } = body;
    if (!fullName?.trim() || !companyName?.trim() || !email?.trim() || !password) {
      log('WARN', 'Registration attempt with missing fields', { 
        hasFullName: !!fullName, 
        hasCompanyName: !!companyName, 
        hasEmail: !!email, 
        hasPassword: !!password 
      });
      throw new UnauthorizedException('All registration fields are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedCompany = companyName.trim();

    log('INFO', 'Registration attempt', { email: normalizedEmail, companyName: trimmedCompany });

    let formattedPhone: string | undefined = undefined;
    if (phone) {
      const trimmed = phone.trim();
      if (!trimmed.startsWith("+")) {
        if (trimmed.length === 10) {
          formattedPhone = `+91${trimmed}`;
        } else {
          formattedPhone = `+${trimmed}`;
        }
      } else {
        formattedPhone = trimmed;
      }
    }

    // Demo Mode registration bypass
    if (isDemoDataMode()) {
      log('INFO', 'Using demo mode for registration', { email: normalizedEmail });
      if (demoUsers.has(normalizedEmail)) {
        log('WARN', 'Demo registration failed - email already exists', { email: normalizedEmail });
        throw new ConflictException('A user with this email address is already registered.');
      }

      const mockUserId = `demo_user_${Date.now()}`;
      const mockMerchantId = `demo_merchant_${Date.now()}`;
      const validRoles = ['Owner', 'Administrator', 'Viewer'];
      const userRole = validRoles.includes(role) ? role : 'Owner';

      const slug = trimmedCompany.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 12);
      const suffix = Math.floor(1000 + Math.random() * 9000);
      const rawApiKey = `codshield_live_${slug}_${suffix}`;
      const apiKeyHash = hashApiKey(rawApiKey);
      const apiKeyMask = maskApiKey(rawApiKey);

      demoMerchants.push({
        id: mockMerchantId,
        name: trimmedCompany,
        apiKeyHash,
        apiKeyMask,
        tier: 'Starter',
        claimRatio: 0,
        createdAt: new Date(),
      });

      demoUsers.set(normalizedEmail, {
        id: mockUserId,
        email: normalizedEmail,
        name: fullName.trim(),
        companyName: trimmedCompany,
        passwordHash: hashPassword(password),
        phone: formattedPhone,
        role: userRole,
        merchantId: mockMerchantId,
      });

      const token = await signSessionToken(
        { sub: mockUserId, email: normalizedEmail, name: fullName.trim(), authType: 'password', sessionKeyVerified: true },
        '1d'
      );

      log('INFO', 'Demo registration successful', { email: normalizedEmail, userId: mockUserId, companyName: trimmedCompany });
      return {
        success: true,
        message: "Account created successfully",
        token,
        user: { id: mockUserId, email: normalizedEmail, name: fullName.trim(), companyName: trimmedCompany }
      };
    }

    try {
      const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingUser) {
        log('WARN', 'Registration failed - email already exists', { email: normalizedEmail });
        throw new ConflictException('A user with this email address is already registered.');
      }

      // Generate API key details
      const slug = trimmedCompany.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 12);
      const suffix = Math.floor(1000 + Math.random() * 9000);
      const rawApiKey = `codshield_live_${slug}_${suffix}`;
      const apiKeyHash = hashApiKey(rawApiKey);
      const apiKeyMask = maskApiKey(rawApiKey);

      // Validate role input
      const validRoles = ['Owner', 'Administrator', 'Viewer'];
      const userRole = validRoles.includes(role) ? role : 'Owner';

      // Atomic Prisma Transaction: Merchant -> MerchantSettings -> User
      const { user } = await this.prisma.$transaction(async (tx) => {
        const merchant = await tx.merchant.create({
          data: {
            name: trimmedCompany,
            apiKeyHash,
            apiKeyMask,
            tier: 'Starter',
            claimRatio: 0,
          }
        });

        await tx.merchantSettings.create({
          data: {
            merchantId: merchant.id,
            autoDispatch: false,
            enableCourierRecommendation: true,
            enableAIConfirmation: true,
            defaultCourier: 'SHIPROCKET',
            fallbackVerification: true,
            analyticsRealtime: true,
          }
        });

        const user = await tx.user.create({
          data: {
            email: normalizedEmail,
            passwordHash: hashPassword(password),
            name: fullName.trim(),
            companyName: trimmedCompany,
            phone: formattedPhone,
            merchantId: merchant.id,
            role: userRole
          }
        });
        return { user, merchant };
      });

      const token = await signSessionToken(
        { sub: user.id, email: user.email, name: user.name, authType: 'password' },
        '1d'
      );

      log('INFO', 'Registration successful', { email: normalizedEmail, userId: user.id, companyName: user.companyName });
      return {
        success: true,
        message: "Account created successfully",
        token,
        user: { id: user.id, email: user.email, name: user.name, companyName: user.companyName }
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof UnauthorizedException) {
        throw error;
      }
      log('ERROR', 'Database error during registration', { email: normalizedEmail, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async resetPassword(email: string, newPassword: string) {
    const normalizedEmail = email.trim().toLowerCase();
    log('INFO', 'Password reset attempt', { email: normalizedEmail });

    if (isDemoDataMode()) {
      log('INFO', 'Using demo mode for password reset', { email: normalizedEmail });
      const demoUser = demoUsers.get(normalizedEmail);
      if (!demoUser) {
        log('WARN', 'Demo password reset failed - user not found', { email: normalizedEmail });
        throw new ConflictException("User not found");
      }
      demoUser.passwordHash = hashPassword(newPassword);
      log('INFO', 'Demo password reset successful', { email: normalizedEmail });
      return;
    }

    try {
      const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        log('WARN', 'Password reset failed - user not found', { email: normalizedEmail });
        throw new ConflictException("User not found");
      }

      await this.prisma.user.update({
        where: { email: normalizedEmail },
        data: { passwordHash: hashPassword(newPassword) }
      });
      log('INFO', 'Password reset successful', { email: normalizedEmail, userId: user.id });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      log('ERROR', 'Database error during password reset', { email: normalizedEmail, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}
