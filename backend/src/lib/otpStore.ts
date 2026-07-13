interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number; // B-11: track wrong attempts
  verifyingInProgress: boolean; // B-09: prevent double-submit
}

export const otpStore = new Map<string, OtpEntry>();

