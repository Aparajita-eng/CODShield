import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export const SESSION_COOKIE_NAME = "codshield_session";
export const SESSION_COOKIE_REFRESH = "codshield_refresh";
export const ACCESS_TOKEN_TTL = "15m";   // B-15: short-lived
export const REFRESH_TOKEN_TTL = "7d";   // B-15: long-lived, rotates on use
export const SESSION_TTL_SHORT = "1d";
export const SESSION_TTL_LONG = "30d";

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.CODSHIELD_DEMO_MODE === 'true') {
      return new TextEncoder().encode("codshield-dev-session-secret");
    }
    throw new Error("Missing SESSION_SECRET environment variable in production mode.");
  }
  return new TextEncoder().encode(secret);
}

function getRefreshSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.CODSHIELD_DEMO_MODE === 'true') {
      return new TextEncoder().encode("codshield-dev-session-secret:refresh");
    }
    throw new Error("Missing SESSION_SECRET environment variable in production mode.");
  }
  return new TextEncoder().encode(secret + ":refresh");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashVerify = scryptSync(password, salt, 64).toString("hex");
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(hashVerify, "hex"));
  } catch {
    return false;
  }
}

export interface SessionPayload {
  sub: string;
  email?: string;
  phone?: string;
  name?: string;
  authType: "password" | "otp";
  sessionKeyVerified?: boolean;
}

export async function signSessionToken(
  payload: SessionPayload,
  ttl: string = ACCESS_TOKEN_TTL
): Promise<string> {
  const { SignJWT } = await import("jose");
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(getSecret());
}

export async function signRefreshToken(payload: SessionPayload): Promise<string> {
  const { SignJWT } = await import("jose");
  return new SignJWT({ ...payload, tokenType: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .sign(getRefreshSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { jwtVerify } = await import("jose");
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || !payload.authType) return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<SessionPayload | null> {
  try {
    const { jwtVerify } = await import("jose");
    const { payload } = await jwtVerify(token, getRefreshSecret());
    if (!payload.sub || !payload.authType || payload.tokenType !== "refresh") return null;
    // Strip tokenType before returning
    const { tokenType, ...rest } = payload as any;
    return rest as SessionPayload;
  } catch {
    return null;
  }
}

export function hashApiKey(apiKey: string): string {
  const { createHash } = require("crypto");
  return createHash("sha256").update(apiKey).digest("hex");
}

export function maskApiKey(apiKey: string): string {
  const parts = apiKey.split("_");
  const suffix = parts[parts.length - 1] || "";
  const slug = parts[parts.length - 2] || "key";
  return `codshield_live_${slug}_••••••••_${suffix}`;
}
