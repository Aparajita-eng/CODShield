import { NextResponse } from "next/server";
import { checkBackendHealth } from "@/lib/api-client";

export async function GET() {
  const health = await checkBackendHealth();
  // Return the full health response including database status
  return NextResponse.json({
    ok: health.ok,
    message: health.message,
    starting: health.starting,
    database: health.ok ? "connected" : "disconnected"
  });
}
