import { proxyBackend } from "@/lib/backend-proxy";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ claimId: string }> }
) {
  const { claimId } = await params;
  const body = await request.json();
  return proxyBackend(`/api/claims/${claimId}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
