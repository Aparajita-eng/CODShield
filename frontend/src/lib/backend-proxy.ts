import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, REFRESH_COOKIE_NAME, verifySessionToken, sessionCookieOptions, refreshCookieOptions } from "@/lib/auth";
import { BACKEND_BASE_URL } from "@/lib/config";

const BACKEND_URL = BACKEND_BASE_URL;

type AuthResult =
  | { ok: true; token: string }
  | { ok: false; response: NextResponse };

export async function requireProxySession(): Promise<AuthResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const session = await verifySessionToken(token);
    if (session) {
      return { ok: true, token };
    }
  }

  // Token is missing or expired. Let's attempt silent refresh.
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
  if (refreshToken) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.token) {
          // Store new credentials in cookies
          cookieStore.set(SESSION_COOKIE_NAME, data.token, sessionCookieOptions(true));
          if (data.refreshToken) {
            cookieStore.set(REFRESH_COOKIE_NAME, data.refreshToken, refreshCookieOptions());
          }
          return { ok: true, token: data.token };
        }
      }
    } catch (err) {
      console.error("Silent token refresh failed:", err);
    }
  }

  // Clear cookies if refresh failed to avoid infinite loop
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);

  return {
    ok: false,
    response: NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }),
  };
}

export async function proxyBackend(
  path: string,
  init?: RequestInit
): Promise<NextResponse> {
  const auth = await requireProxySession();
  if (!auth.ok) return auth.response;

  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${auth.token}`,
      },
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to reach backend" },
      { status: 500 }
    );
  }
}
