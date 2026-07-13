import { proxyBackend } from "@/lib/backend-proxy";

export async function POST(request: Request) {
  return proxyBackend("/api/settings/password", {
    method: "POST",
    body: await request.text(),
    headers: { "Content-Type": "application/json" },
  });
}
