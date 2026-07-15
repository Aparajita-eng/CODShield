import { proxyBackend } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  const body = await request.json();
  return proxyBackend("/api/sandbox/orders/risk-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}