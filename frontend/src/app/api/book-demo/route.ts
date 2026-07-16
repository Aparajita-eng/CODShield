import { NextResponse } from "next/server";
import { headers } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

export async function POST(request: Request) {
  const body = await request.json();
  const headersList = await headers();
  const clientIp = headersList.get("x-forwarded-for") || headersList.get("x-real-ip");

  const forwardHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (clientIp) {
    forwardHeaders["x-forwarded-for"] = clientIp;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/book-demo`, {
      method: "POST",
      headers: forwardHeaders,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to reach backend" },
      { status: 500 }
    );
  }
}

