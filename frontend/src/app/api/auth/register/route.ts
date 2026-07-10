import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
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

    response.cookies.set(SESSION_COOKIE_NAME, data.token, sessionCookieOptions(true));
    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to reach backend" },
      { status: 500 }
    );
  }
}
