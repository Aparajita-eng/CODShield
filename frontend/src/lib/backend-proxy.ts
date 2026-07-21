import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, REFRESH_COOKIE_NAME, verifySessionToken, sessionCookieOptions, refreshCookieOptions } from "@/lib/auth";
import { apiFetch, getUserFriendlyError, ApiError } from "@/lib/api-client";

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
      const res = await apiFetch("/api/auth/refresh", {
        method: "POST",
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
    const res = await apiFetch(path, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${auth.token}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("Proxy backend error:", error);
    
    let errorMessage = "Failed to reach backend";
    let statusCode = 500;

    if (error instanceof ApiError) {
      errorMessage = getUserFriendlyError(error);
      statusCode = error.status || 500;
    } else if (error instanceof Error) {
      if (error.message.includes("Network error") || error.message.includes("backend unreachable")) {
        errorMessage = "Backend is starting up - please wait a moment and try again";
        statusCode = 503;
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timed out - please try again";
        statusCode = 504;
      } else if (error.message.includes("Database")) {
        errorMessage = "Database temporarily unavailable - please try again";
        statusCode = 503;
      } else {
        errorMessage = error.message || "An error occurred";
      }
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: statusCode }
    );
  }
}
