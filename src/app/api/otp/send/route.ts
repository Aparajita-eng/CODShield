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

    // Format phone number to E.164 standard for Twilio
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("+")) {
      if (formattedPhone.length === 10) {
        formattedPhone = `+91${formattedPhone}`; // Default to India country code
      } else {
        formattedPhone = `+${formattedPhone}`;
      }
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    let realSmsSent = false;
    let smsError = "";

    if (accountSid && authToken && fromNumber) {
      try {
        const bodyParams = new URLSearchParams();
        bodyParams.append("To", formattedPhone);
        bodyParams.append("From", fromNumber);
        bodyParams.append("Body", `Your CODShield Verification Code is: ${rawCode}. Valid for 5 minutes.`);

        const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Authorization": authHeader,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: bodyParams.toString(),
          }
        );

        const twilioData = await twilioRes.json();
        if (twilioRes.ok) {
          realSmsSent = true;
        } else {
          smsError = twilioData.message || "Twilio failed to dispatch message";
        }
      } catch (err: any) {
        smsError = err.message || "Twilio connection network error";
      }
    }

    return NextResponse.json({
      success: true,
      message: realSmsSent
        ? `Real OTP dispatched to ${formattedPhone} via Twilio.`
        : `Simulated OTP sent to ${phone} via SMS and WhatsApp (Twilio not configured).`,
      code: realSmsSent ? undefined : rawCode, // Hide verification code from JSON payload when real SMS is active
      simulated: !realSmsSent,
      error: smsError || undefined,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
