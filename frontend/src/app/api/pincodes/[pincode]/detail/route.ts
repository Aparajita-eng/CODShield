import { proxyBackend } from "@/lib/backend-proxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pincode: string }> }
) {
  const { pincode } = await params;
  const url = new URL(request.url);
  return proxyBackend(`/api/pincodes/${pincode}/detail${url.search}`);
}
