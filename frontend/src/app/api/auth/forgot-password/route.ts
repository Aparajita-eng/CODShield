import { NextResponse } from "next/server";

import { BACKEND_BASE_URL } from "@/lib/config";
const BACKEND_URL = BACKEND_BASE_URL;

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to reach backend" },
      { status: 500 }
    );
  }
}
