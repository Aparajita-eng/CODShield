import { NextResponse } from "next/server";
import { calculateRisk } from "@/lib/risk";

export async function POST(request: Request) {
  try {
    const { phone, pincode, value } = await request.json();

    if (!phone || !pincode || value === undefined) {
      return NextResponse.json(
        { success: false, message: "Phone, pincode, and order value are required" },
        { status: 400 }
      );
    }

    const orderValue = parseFloat(value);
    if (isNaN(orderValue) || orderValue < 0) {
      return NextResponse.json(
        { success: false, message: "Valid numeric order value is required" },
        { status: 400 }
      );
    }

    const assessment = await calculateRisk(
      phone.trim(),
      pincode.trim(),
      orderValue
    );

    return NextResponse.json({
      success: true,
      assessment,
    });
  } catch (error) {
    console.error("Error evaluating order risk:", error);
    return NextResponse.json(
      { success: false, message: "Failed to evaluate order risk" },
      { status: 500 }
    );
  }
}
