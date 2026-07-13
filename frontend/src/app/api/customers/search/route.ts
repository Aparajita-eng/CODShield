import { proxyBackend } from "@/lib/backend-proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyBackend(`/api/customers/search${url.search}`);
}
