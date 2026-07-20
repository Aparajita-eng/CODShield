import { proxyBackend, requireProxySession } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyBackend(`/api/integrations${url.search}`);
}

export async function POST(request: Request) {
  const auth = await requireProxySession();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  return proxyBackend("/api/integrations/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
