type OtpEntry = {
  code: string;
  expiresAt: number;
};

const globalForOtp = globalThis as unknown as {
  otpStore: Map<string, OtpEntry> | undefined;
};

export const otpStore =
  globalForOtp.otpStore ?? new Map<string, OtpEntry>();

if (process.env.NODE_ENV !== "production") globalForOtp.otpStore = otpStore;
