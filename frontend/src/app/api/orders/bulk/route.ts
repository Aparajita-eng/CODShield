import { proxyBackend } from "@/lib/backend-proxy";

export async function PATCH(request: Request) {
  const body = await request.text();
  return proxyBackend("/api/orders/bulk", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
