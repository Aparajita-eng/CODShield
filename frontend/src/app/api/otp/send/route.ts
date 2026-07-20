import { BACKEND_BASE_URL } from "@/lib/config";

const backendUrl = BACKEND_BASE_URL;

export async function POST(request: Request) {
  const body = await request.json();
  
  try {
    const res = await fetch(`${backendUrl}/api/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json(
      { success: false, message: "Failed to reach backend" },
      { status: 500 }
    );
  }
}
