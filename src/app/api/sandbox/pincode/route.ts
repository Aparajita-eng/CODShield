import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export async function POST(request: Request) {
  try {
    const { pincode } = await request.json();

    if (!pincode || pincode.trim().length !== 6) {
      return NextResponse.json(
        { success: false, message: "Valid 6-digit pincode is required" },
        { status: 400 }
      );
    }

    const pin = pincode.trim();
    const pinRecord = await prisma.pincodeRisk.findUnique({
      where: { pincode: pin },
    });

    const weight = pinRecord ? pinRecord.riskWeight : 0.25;
    const h = hashStr(pin);

    // Calculate simulated metrics
    const rto = Math.round(weight * 40 + 4);
    const accept = Math.round(100 - rto - (h % 8));

    let level = "Medium risk zone";
    let color = "text-riskmid";

    if (rto < 12) {
      level = "Low risk zone";
      color = "text-risklow";
    } else if (rto > 22) {
      level = "High risk zone";
      color = "text-riskhigh";
    }

    return NextResponse.json({
      success: true,
      pincode: pin,
      weight,
      rto,
      accept,
      level,
      color,
    });
  } catch (error) {
    console.error("Error evaluating pincode risk:", error);
    return NextResponse.json(
      { success: false, message: "Failed to evaluate pincode risk" },
      { status: 500 }
    );
  }
}
