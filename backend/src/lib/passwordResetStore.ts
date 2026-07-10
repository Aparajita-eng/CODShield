interface ResetEntry {
  email: string;
  token: string;
  expiresAt: number;
}

export const passwordResetStore = new Map<string, ResetEntry>();
