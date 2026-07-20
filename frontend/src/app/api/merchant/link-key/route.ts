import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, REFRESH_COOKIE_NAME, sessionCookieOptions, refreshCookieOptions } from "@/lib/auth";
import { requireProxySession } from "@/lib/backend-proxy";

import { BACKEND_BASE_URL } from "@/lib/config";
const BACKEND_URL = BACKEND_BASE_URL;

export async function POST(request: Request) {
  // 1. Ensure the user has an active session before proxying
  const auth = await requireProxySession();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const body = await request.json();

    // 2. Call NestJS backend link-key endpoint with Bearer auth
    const res = await fetch(`${BACKEND_URL}/api/merchant/link-key`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      // Propagate structured backend errors (e.g. KEY_NOT_RECOGNIZED)
      return NextResponse.json(data, { status: res.status });
    }

    // 3. Set updated cookies containing sessionKeyVerified: true
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, data.token, sessionCookieOptions(true));
    if (data.refreshToken) {
      cookieStore.set(REFRESH_COOKIE_NAME, data.refreshToken, refreshCookieOptions());
    }

    return NextResponse.json({
      success: true,
      merchantId: data.merchantId,
      merchantName: data.merchantName,
      apiKeyMask: data.apiKeyMask,
      tier: data.tier,
    });
  } catch (error) {
    console.error("Proxy link-key error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reach backend" },
      { status: 500 }
    );
  }
}
