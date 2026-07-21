import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, REFRESH_COOKIE_NAME, sessionCookieOptions, refreshCookieOptions } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  
  // Clear session cookie with matching path
  response.cookies.set(SESSION_COOKIE_NAME, "", { ...sessionCookieOptions(), maxAge: 0 });
  
  // Clear refresh cookie with matching path
  response.cookies.set(REFRESH_COOKIE_NAME, "", { ...refreshCookieOptions(), maxAge: 0 });
  
  return response;
}
