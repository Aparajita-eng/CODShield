import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, verifyPassword, signSessionToken, hashApiKey, maskApiKey } from '../../lib/auth';
import { isDemoDataMode } from '../../lib/demoData';

const DEMO_EMAIL = (process.env.DEMO_USER_EMAIL || "demo@codshield.com").toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || "Demo@1234";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(body: any) {
    const { email, password, rememberMe = false } = body;
    if (!email?.trim() || !password) {
      throw new UnauthorizedException('Email and password are required');
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const token = await signSessionToken(
        { sub: 'demo-user', email: DEMO_EMAIL, name: 'Demo Merchant', authType: 'password' },
        rememberMe ? '30d' : '1d'
      );
      return {
        success: true,
        message: "Logged in successfully",
        token,
        user: { id: 'demo-user', email: DEMO_EMAIL, name: 'Demo Merchant', companyName: 'FastCommerce Inc.' }
      };
    }

    try {
      const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (user && verifyPassword(password, user.passwordHash)) {
        const token = await signSessionToken(
          { sub: user.id, email: user.email, name: user.name, authType: 'password' },
          rememberMe ? '30d' : '1d'
        );
        return {
          success: true,
          message: "Logged in successfully",
          token,
          user: { id: user.id, email: user.email, name: user.name, companyName: user.companyName }
        };
      }
    } catch (e) {
      console.warn("Prisma unavailable during login, fallback to demo mode:", e);
    }

    throw new UnauthorizedException('Invalid email or password');
  }

  async register(body: any) {
    const { fullName, companyName, email, password, phone } = body;
    if (!fullName?.trim() || !companyName?.trim() || !email?.trim() || !password) {
      throw new UnauthorizedException('All registration fields are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedCompany = companyName.trim();

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

    const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new ConflictException('A user with this email address is already registered.');
    }

    const existingMerchant = await this.prisma.merchant.findFirst({ where: { name: trimmedCompany } });
    if (existingMerchant) {
      throw new ConflictException('A merchant account with this company name already exists.');
    }

    // Generate API key details
    const slug = trimmedCompany.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 12);
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const rawApiKey = `codshield_live_${slug}_${suffix}`;
    const apiKeyHash = hashApiKey(rawApiKey);
    const apiKeyMask = maskApiKey(rawApiKey);

    const { user } = await this.prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant.create({
        data: { name: trimmedCompany, apiKeyHash, apiKeyMask, tier: 'Starter', claimRatio: 0 }
      });

      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash: hashPassword(password),
          name: fullName.trim(),
          companyName: trimmedCompany,
          phone: formattedPhone,
          merchantId: merchant.id
        }
      });
      return { user };
    });

    const token = await signSessionToken(
      { sub: user.id, email: user.email, name: user.name, authType: 'password' },
      '1d'
    );

    return {
      success: true,
      message: "Account created successfully",
      token,
      user: { id: user.id, email: user.email, name: user.name, companyName: user.companyName }
    };
  }
}
