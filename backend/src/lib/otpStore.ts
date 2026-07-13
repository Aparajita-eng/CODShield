interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number; // B-11: track wrong attempts
}

export const otpStore = new Map<string, OtpEntry>();

