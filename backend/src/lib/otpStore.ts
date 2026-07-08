interface OtpEntry {
  code: string;
  expiresAt: number;
}

export const otpStore = new Map<string, OtpEntry>();
