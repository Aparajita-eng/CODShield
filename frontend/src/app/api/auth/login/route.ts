import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, REFRESH_COOKIE_NAME, sessionCookieOptions, refreshCookieOptions } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!data.success || !data.token) {
      return NextResponse.json(data, { status: res.status });
    }

    const response = NextResponse.json({
      success: true,
      message: data.message,
      user: data.user,
    });

    response.cookies.set(SESSION_COOKIE_NAME, data.token, sessionCookieOptions(Boolean(body.rememberMe)));

    // B-15: also store the refresh token if the backend returned one
    if (data.refreshToken) {
      response.cookies.set(REFRESH_COOKIE_NAME, data.refreshToken, refreshCookieOptions());
    }

    return response;
  } catch (error) {
    console.error("Login fetch error details:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reach backend" },
      { status: 500 }
    );
  }
}
