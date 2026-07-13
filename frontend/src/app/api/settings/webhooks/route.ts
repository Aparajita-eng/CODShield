import { proxyBackend } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyBackend(`/api/settings/webhooks${url.search}`);
}

export async function POST(request: Request) {
  return proxyBackend("/api/settings/webhooks", {
    method: "POST",
    body: await request.text(),
    headers: { "Content-Type": "application/json" },
  });
}
