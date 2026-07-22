import { jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "codshield_session";
export const REFRESH_COOKIE_NAME = "codshield_refresh";  // B-15
export const SESSION_MAX_AGE_SHORT = 60 * 60 * 24;       // 1 day
export const SESSION_MAX_AGE_LONG = 60 * 60 * 24 * 30;   // 30 days
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;         // 7 days

function getSecret(): Uint8Array {
  if (typeof window !== "undefined") {
    throw new Error("Security Error: JWT secret retrieval attempted on client-side.");
  }
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET environment variable is not set. " +
      "Set it to the same value on both the frontend and backend Render services."
    );
  }
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
  } catch (err) {
    // Log so a secret mismatch surfaces in Render logs as repeated failures
    console.warn("Session token verification failed:", err instanceof Error ? err.message : String(err));
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

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/auth/refresh",   // only sent to the refresh endpoint
    maxAge: REFRESH_MAX_AGE,
  };
}
