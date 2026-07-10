import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

  try {
    const res = await fetch(`${backendUrl}/api/auth/login`, {
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

    response.cookies.set(SESSION_COOKIE_NAME, data.token, sessionCookieOptions);
    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to reach backend" },
      { status: 500 }
    );
  }
}
