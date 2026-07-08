import { NextResponse } from "next/server";
import { otpStore } from "@/lib/otpStore";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || phone.trim().length < 10) {
      return NextResponse.json(
        { success: false, message: "Valid 10-digit phone number is required" },
        { status: 400 }
      );
    }

    const rawCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute expiry

    otpStore.set(phone.trim(), { code: rawCode, expiresAt });

    return NextResponse.json({
      success: true,
      message: `Simulated OTP sent to ${phone} via SMS and WhatsApp.`,
      code: rawCode,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
