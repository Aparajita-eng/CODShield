import { NextResponse } from "next/server";
import { checkBackendHealth } from "@/lib/api-client";

export async function GET() {
  const health = await checkBackendHealth();
  return NextResponse.json(health);
}
