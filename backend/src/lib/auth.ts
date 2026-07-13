import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "codshield_session";
export const SESSION_TTL_SHORT = "1d";
export const SESSION_TTL_LONG = "30d";

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || "codshield-dev-session-secret";
  return new TextEncoder().encode(secret);
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
}

export async function signSessionToken(
  payload: SessionPayload,
  ttl: string = SESSION_TTL_LONG
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(getSecret());
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
