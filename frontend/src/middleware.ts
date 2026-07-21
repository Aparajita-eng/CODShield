import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, REFRESH_COOKIE_NAME, verifySessionToken, sessionCookieOptions, refreshCookieOptions } from "@/lib/auth";

// NOTE: middleware runs on the Edge runtime — cannot import from @/lib/config.
// Read env vars directly here; BACKEND_URL is a server-only runtime var.
const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001").replace(/\/$/, "");


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicOnly = pathname === "/login" || pathname === "/register";
  
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const session = await verifySessionToken(token);
    if (session) {
      // User is authenticated
      if (isPublicOnly) {
        // Redirect authenticated users away from login/register
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
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
          // Token refreshed successfully
          if (isPublicOnly) {
            // Redirect authenticated users away from login/register
            const response = NextResponse.redirect(new URL("/dashboard", request.url));
            response.cookies.set(SESSION_COOKIE_NAME, data.token, sessionCookieOptions(true));
            if (data.refreshToken) {
              response.cookies.set(REFRESH_COOKIE_NAME, data.refreshToken, refreshCookieOptions());
            }
            return response;
          }
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

  // User is not authenticated
  if (isPublicOnly) {
    // Allow access to login/register pages
    return NextResponse.next();
  }

  // Redirect to login for protected routes
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.delete(REFRESH_COOKIE_NAME);
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",  // Protect dashboard routes
    "/login",             // Public-only - redirect authenticated users
    "/register",          // Public-only - redirect authenticated users
  ],
};
