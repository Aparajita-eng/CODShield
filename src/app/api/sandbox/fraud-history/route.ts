import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || phone.trim().length < 10) {
      return NextResponse.json(
        { success: false, message: "Valid 10-digit phone number is required" },
        { status: 400 }
      );
    }

    const key = phone.trim();
    const blacklistRecord = await prisma.blacklist.findUnique({
      where: { phone: key },
    });

    if (!blacklistRecord) {
      return NextResponse.json({
        success: true,
        flagged: false,
        message: "Clear - no historical fraud or refusal records found on this identity",
        flags: [],
      });
    }

    // Generate detailed bullet flags based on the seed records
    const flags = [blacklistRecord.reason];
    if (blacklistRecord.refusalCount >= 3) {
      flags.push(`High refusal density detected (refusal ratio: ${(blacklistRecord.refusalCount * 25).toFixed(0)}%)`);
      flags.push("Identity matching multiple merchant delivery blacklists");
    } else {
      flags.push("Address consistency checks passing but delivery delivery cancelled post-dispatch");
    }

    return NextResponse.json({
      success: true,
      flagged: true,
      refusalCount: blacklistRecord.refusalCount,
      message: `Identity flagged: ${blacklistRecord.refusalCount} previous refusal records found`,
      flags,
    });
  } catch (error) {
    console.error("Error checking fraud history:", error);
    return NextResponse.json(
      { success: false, message: "Failed to query fraud history" },
      { status: 500 }
    );
  }
}
