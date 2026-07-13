import { proxyBackend } from "@/lib/backend-proxy";

export async function PATCH(request: Request) {
  return proxyBackend("/api/settings/company", {
    method: "PATCH",
    body: await request.text(),
    headers: { "Content-Type": "application/json" },
  });
}
