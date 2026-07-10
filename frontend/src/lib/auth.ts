import { jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "codshield_session";
export const SESSION_MAX_AGE_SHORT = 60 * 60 * 24; // 1 day
export const SESSION_MAX_AGE_LONG = 60 * 60 * 24 * 30; // 30 days

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || "codshield-dev-session-secret";
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  sub: string;
  email?: string;
  phone?: string;
  name?: string;
  authType: "password" | "otp";
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || !payload.authType) return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(rememberMe = true) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: rememberMe ? SESSION_MAX_AGE_LONG : SESSION_MAX_AGE_SHORT,
  };
}
