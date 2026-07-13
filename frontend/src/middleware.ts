import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, REFRESH_COOKIE_NAME, verifySessionToken, sessionCookieOptions, refreshCookieOptions } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const session = await verifySessionToken(token);
    if (session) {
      return NextResponse.next();
    }
  }

  // Token is missing or expired, attempt refresh
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
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
          // Token refreshed successfully, allow passage and set cookies
          const response = NextResponse.next();
          response.cookies.set(SESSION_COOKIE_NAME, data.token, sessionCookieOptions(true));
          if (data.refreshToken) {
            response.cookies.set(REFRESH_COOKIE_NAME, data.refreshToken, refreshCookieOptions());
          }
          return response;
        }
      }
    } catch (err) {
      console.error("Middleware token refresh failed:", err);
    }
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.delete(REFRESH_COOKIE_NAME);
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
