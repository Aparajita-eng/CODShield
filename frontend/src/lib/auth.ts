import { jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "codshield_session";

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

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};
