import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth";
import { apiFetch, getUserFriendlyError, ApiError } from "@/lib/api-client";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
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
    }, { status: res.status });

    response.cookies.set(SESSION_COOKIE_NAME, data.token, sessionCookieOptions(true));
    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    
    let errorMessage = "Registration failed";
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
