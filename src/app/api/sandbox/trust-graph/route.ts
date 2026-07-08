import { NextResponse } from "next/server";

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export async function POST(request: Request) {
  try {
    const { phone, address } = await request.json();

    if (!phone || !address) {
      return NextResponse.json(
        { success: false, message: "Phone and address are required" },
        { status: 400 }
      );
    }

    const h = hashStr(phone + address);
    const score = 40 + (h % 56); // 40 to 95
    const connections = h % 12; // 0 to 11 matches

    let verdict = "Moderate trust";
    let color = "text-riskmid";
    let statusClass = "riskmid";

    if (score >= 75) {
      verdict = "High trust";
      color = "text-risklow";
      statusClass = "risklow";
    } else if (score < 50) {
      verdict = "Low trust - review recommended";
      color = "text-riskhigh";
      statusClass = "riskhigh";
    }

    return NextResponse.json({
      success: true,
      score,
      verdict,
      color,
      statusClass,
      connections,
    });
  } catch (error) {
    console.error("Error evaluating trust graph:", error);
    return NextResponse.json(
      { success: false, message: "Failed to evaluate trust graph" },
      { status: 500 }
    );
  }
}
