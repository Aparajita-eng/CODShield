import type { SessionPayload } from "./auth";
import { prisma } from "./db";
import { DEMO_MERCHANT_ACME_ID } from "./demoData";

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
  | { ok: false; status: number; message: string }
> {
  const allowedIds = await getMerchantIdsForSession(session);

  if (!allowedIds.length) {
    return { ok: false, status: 403, message: "No merchant account linked to this user" };
  }

  const merchantId = requestedMerchantId?.trim() || allowedIds[0];

  if (!allowedIds.includes(merchantId)) {
    return { ok: false, status: 403, message: "You do not have access to this merchant account" };
  }

  return { ok: true, merchantId, allowedIds };
}
