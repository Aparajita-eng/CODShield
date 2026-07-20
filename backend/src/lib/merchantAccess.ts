import { ForbiddenException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import type { SessionPayload } from "./auth";
import { prisma } from "./db";
import { DEMO_MERCHANT_ACME_ID, isDemoDataMode } from "./demoData";

const DEMO_EMAIL = (process.env.DEMO_USER_EMAIL || "demo@codshield.com").toLowerCase();

function isDemoSession(session: SessionPayload): boolean {
  return session.sub === "demo-user" || session.email?.toLowerCase() === DEMO_EMAIL;
}

/**
 * Resolves merchant IDs the authenticated session may access.
 * Demo user → Acme only (in-memory). DB users → User.merchantId FK.
 */
export async function getMerchantIdsForSession(session: SessionPayload): Promise<string[]> {
  if (isDemoSession(session)) {
    return [DEMO_MERCHANT_ACME_ID];
  }

  if (isDemoDataMode()) {
    const { demoUsers } = require("../modules/auth/auth.service");
    let user = Array.from(demoUsers.values()).find((u: any) => u.id === session.sub) as any;
    if (!user) {
      // Re-hydrate on request if missing
      console.log(`Re-hydrating missing demo user ${session.sub} during access check.`);
      const email = session.email?.toLowerCase() || `guest_${session.sub}@example.com`;
      user = {
        id: session.sub,
        email,
        name: session.name || 'Guest Merchant',
        companyName: 'Simulated Company',
        passwordHash: '',
        role: 'Owner',
      };
      demoUsers.set(email, user);
    }
    if (user?.merchantId) {
      return [user.merchantId];
    }
    return [];
  }

  try {
    let user = null;
    if (session.authType === "otp" && session.phone) {
      user = await prisma.user.findFirst({
        where: { phone: session.phone },
        select: { merchantId: true },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { id: session.sub },
        select: { merchantId: true },
      });
    }

    if (user?.merchantId) {
      return [user.merchantId];
    }

    return [];
  } catch {
    return isDemoSession(session) ? [DEMO_MERCHANT_ACME_ID] : [];
  }
}

export async function assertSessionMerchantAccess(
  session: SessionPayload,
  merchantId: string
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const allowed = await getMerchantIdsForSession(session);

  if (!allowed.length) {
    return { ok: false, status: 403, message: "No merchant account linked to this user" };
  }

  if (!allowed.includes(merchantId)) {
    return { ok: false, status: 403, message: "You do not have access to this merchant account" };
  }

  return { ok: true };
}

/** Resolve the active merchant for this request; optional merchantId must be in the session's allowed set. */
export async function resolveActiveMerchantId(
  session: SessionPayload,
  requestedMerchantId?: string
): Promise<
  | { ok: true; merchantId: string; allowedIds: string[] }
  | { ok: false; status: number; code?: string; message: string }
> {
  const allowedIds = await getMerchantIdsForSession(session);

  if (!allowedIds.length) {
    return { ok: false, status: 403, message: "No merchant account linked to this user" };
  }

  // Session-scoped UX flag only.
  // Merchant authorization is enforced by User.merchantId.
  // This flag is NOT a security boundary.
  const isDemo = session.sub === "demo-user" || session.email?.toLowerCase() === (process.env.DEMO_USER_EMAIL || "demo@codshield.com").toLowerCase();
  if (!session.sessionKeyVerified && !isDemo) {
    return { ok: false, status: 403, code: "KEY_NOT_LINKED", message: "API key verification required. Please link your API key." };
  }

  const merchantId = requestedMerchantId?.trim() || allowedIds[0];

  if (!allowedIds.includes(merchantId)) {
    return { ok: false, status: 403, message: "You do not have access to this merchant account" };
  }

  return { ok: true, merchantId, allowedIds };
}

export function handleMerchantScopeError(scope: { ok: false; status: number; code?: string; message: string }): never {
  if (scope.status === 403) {
    throw new ForbiddenException({
      statusCode: 403,
      code: scope.code,
      message: scope.message,
    });
  }
  if (scope.status === 401) {
    throw new UnauthorizedException(scope.message);
  }
  throw new BadRequestException(scope.message);
}
