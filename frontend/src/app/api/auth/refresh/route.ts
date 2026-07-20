// B-15: Frontend refresh proxy — reads codshield_refresh cookie, calls backend, rotates both cookies
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  sessionCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth";

import { BACKEND_BASE_URL } from "@/lib/config";
const BACKEND_URL = BACKEND_BASE_URL;

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return NextResponse.json({ success: false, message: "No refresh token" }, { status: 401 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json();

    if (!data.success || !data.token) {
      // Refresh failed — clear both cookies and force re-login
      const response = NextResponse.json({ success: false, message: "Session expired" }, { status: 401 });
      response.cookies.delete(SESSION_COOKIE_NAME);
      response.cookies.delete(REFRESH_COOKIE_NAME);
      return response;
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, data.token, sessionCookieOptions(true));
    if (data.refreshToken) {
      response.cookies.set(REFRESH_COOKIE_NAME, data.refreshToken, refreshCookieOptions());
    }
    return response;
  } catch {
    return NextResponse.json({ success: false, message: "Failed to reach backend" }, { status: 500 });
  }
}
