import { proxyBackend } from "@/lib/backend-proxy";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  return proxyBackend(`/api/orders/${orderId}`);
}
