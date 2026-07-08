import { NextResponse } from "next/server";
import { otpStore } from "@/lib/otpStore";

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { success: false, message: "Phone number and verification code are required" },
        { status: 400 }
      );
    }

    const key = phone.trim();
    const entry = otpStore.get(key);

    if (!entry) {
      return NextResponse.json({
        success: false,
        message: "No active verification request found for this number",
      });
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(key);
      return NextResponse.json({
        success: false,
        message: "Verification code has expired",
      });
    }

    if (entry.code !== code.trim()) {
      return NextResponse.json({
        success: false,
        message: "Verification code mismatch",
      });
    }

    // Clean up on successful verification
    otpStore.delete(key);

    return NextResponse.json({
      success: true,
      message: "Phone number verified. Buyer intent confirmed.",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { success: false, message: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
