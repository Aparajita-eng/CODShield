import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    // Return steps simulating verification delay
    return NextResponse.json({
      success: true,
      orderId,
      steps: [
        { name: "Proof uploaded", status: "completed", message: "Delivery refusal documentation registered" },
        { name: "Courier verified", status: "completed", message: "Logistics API status confirmed as RTO" },
        { name: "AI fraud check", status: "completed", message: "No collusive patterns or merchant manipulation detected" },
        { name: "Payout approved", status: "completed", message: "Disbursement of ₹1,850 credited to balance" }
      ]
    });
  } catch (error) {
    console.error("Error processing simulated claim:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process simulated claim" },
      { status: 500 }
    );
  }
}
