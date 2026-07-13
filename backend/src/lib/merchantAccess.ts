import type { SessionPayload } from "./auth";
import { prisma } from "./db";
import { fetchMerchants } from "./dataAccess";
import { DEMO_MERCHANT_ACME_ID } from "./demoData";

const DEMO_EMAIL = (process.env.DEMO_USER_EMAIL || "demo@codshield.com").toLowerCase();

function isDemoSession(session: SessionPayload): boolean {
  return session.sub === "demo-user" || session.email?.toLowerCase() === DEMO_EMAIL;
}

/**
 * Resolves merchant IDs the authenticated session may access.
 * Demo user → Acme only. Registered users → merchant(s) whose name matches user.companyName.
 */
export async function getMerchantIdsForSession(session: SessionPayload): Promise<string[]> {
  if (isDemoSession(session)) {
    return [DEMO_MERCHANT_ACME_ID];
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user?.companyName) return [];

    const merchants = await fetchMerchants();
    return merchants.filter((m) => m.name === user.companyName).map((m) => m.id);
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
