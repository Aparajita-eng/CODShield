import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const res = await fetch(`${BACKEND_URL}/api/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!data.success) {
      return NextResponse.json(data, { status: res.status });
    }

    const sessionRes = await fetch(`${BACKEND_URL}/api/auth/otp-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: body.phone,
        rememberMe: body.rememberMe ?? true,
      }),
    });

    const sessionData = await sessionRes.json();

    if (!sessionData.success || !sessionData.token) {
      return NextResponse.json(
        { success: false, message: "Verified but failed to create session" },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: data.message,
    });

    response.cookies.set(
      SESSION_COOKIE_NAME,
      sessionData.token,
      sessionCookieOptions(body.rememberMe ?? true)
    );
    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to reach backend" },
      { status: 500 }
    );
  }
}
