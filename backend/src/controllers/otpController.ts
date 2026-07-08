import { Request, Response } from "express";
import { otpStore } from "../lib/otpStore";

export async function sendOtp(req: Request, res: Response): Promise<any> {
  try {
    const { phone } = req.body;

    if (!phone || phone.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit phone number is required"
      });
    }

    const rawCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute expiry

    otpStore.set(phone.trim(), { code: rawCode, expiresAt });

    // Format phone number to E.164 standard (+91...)
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("+")) {
      if (formattedPhone.length === 10) {
        formattedPhone = `+91${formattedPhone}`; // Default to India country code
      } else {
        formattedPhone = `+${formattedPhone}`;
      }
    }

    // Supported SMS Gateway API Keys
    const twoFactorApiKey = process.env.TWOFACTOR_API_KEY;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    let realSmsSent = false;
    let smsError = "";
    let providerName = "";

    // 1. Prioritize 2Factor.in integration (Recommended for India)
    if (twoFactorApiKey) {
      providerName = "2Factor";
      try {
        const cleanPhone = formattedPhone.replace("+", ""); // e.g. 919579926020
        const twoFactorRes = await fetch(
          `https://2factor.in/API/V1/${twoFactorApiKey}/SMS/${cleanPhone}/${rawCode}`,
          { method: "GET" }
        );

        const twoFactorData = (await twoFactorRes.json()) as any;
        if (twoFactorRes.ok && twoFactorData.Status === "Success") {
          realSmsSent = true;
        } else {
          smsError = twoFactorData.Details || "2Factor returned an error";
        }
      } catch (err: any) {
        smsError = err.message || "2Factor network connection error";
      }
    }
    // 2. Fallback to Twilio integration
    else if (accountSid && authToken && fromNumber) {
      providerName = "Twilio";
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

        const twilioData = (await twilioRes.json()) as any;
        if (twilioRes.ok) {
          realSmsSent = true;
        } else {
          smsError = twilioData.message || "Twilio failed to dispatch message";
        }
      } catch (err: any) {
        smsError = err.message || "Twilio connection network error";
      }
    }

    return res.json({
      success: true,
      message: realSmsSent
        ? `Real OTP dispatched to ${formattedPhone} via ${providerName}.`
        : `Simulated OTP sent to ${phone} via SMS and WhatsApp (SMS keys not configured).`,
      code: realSmsSent ? undefined : rawCode, // Hide verification code from JSON payload when real SMS is active
      simulated: !realSmsSent,
      error: smsError || undefined,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP"
    });
  }
}

export async function verifyOtp(req: Request, res: Response): Promise<any> {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: "Phone number and verification code are required"
      });
    }

    const record = otpStore.get(phone.trim());

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "No verification request found for this phone number"
      });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(phone.trim());
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new one."
      });
    }

    if (record.code !== code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code"
      });
    }

    // Success - clean store
    otpStore.delete(phone.trim());

    return res.json({
      success: true,
      message: "Phone number verified. Buyer intent confirmed."
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP"
    });
  }
}
