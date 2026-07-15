import 'dotenv/config';
import { strict as assert } from 'assert';
import { AuthController } from '../auth.controller';
import { BadRequestException } from '@nestjs/common';

async function testOtpWindowReset() {
  console.log("=== STARTING OTP RATE-LIMIT WINDOW RESET UNIT TESTS ===");

  const originalDemoMode = process.env.CODSHIELD_DEMO_MODE;

  // ==========================================
  // Test Case 1: Demo (In-Memory) Mode Reset
  // ==========================================
  {
    console.log("Testing OTP rate-limit reset in Demo (In-Memory) mode...");
    process.env.CODSHIELD_DEMO_MODE = 'true';

    const mockAuthService = {} as any;
    const mockPrisma = {} as any;
    const controller = new AuthController(mockAuthService, mockPrisma);

    const testPhone = "9998887776";

    // 1. First 5 attempts should succeed (no exception thrown)
    for (let i = 1; i <= 5; i++) {
      await controller['checkAndIncrementOtpAttempts'](testPhone);
    }
    console.log("✅ First 5 attempts succeeded.");

    // 2. 6th attempt should fail with BadRequestException
    await assert.rejects(
      async () => {
        await controller['checkAndIncrementOtpAttempts'](testPhone);
      },
      (err: any) => {
        assert(err instanceof BadRequestException);
        assert.equal(err.message, "Too many OTP attempts. Please try again after 15 minutes.");
        console.log("✅ 6th attempt correctly blocked.");
        return true;
      }
    );

    // 3. Simulate passage of 16 minutes (advancing clock)
    const demoOtpAttempts = require('../auth.controller')['demoOtpAttempts'];
    const record = demoOtpAttempts.get(testPhone.trim());
    if (record) {
      record.firstAttemptAt = Date.now() - 16 * 60 * 1000;
    }

    // 4. Next attempt should now succeed (rate-limit window reset)
    await controller['checkAndIncrementOtpAttempts'](testPhone);
    console.log("✅ 7th attempt after 16 minutes succeeded (window successfully reset).");
  }

  // ==========================================
  // Test Case 2: Database Mode Reset
  // ==========================================
  {
    console.log("Testing OTP rate-limit reset in Database mode...");
    process.env.CODSHIELD_DEMO_MODE = 'false';

    // Mock database state
    let mockDbAttempts = new Map<string, { phone: string; attempts: number; firstAttemptAt: Date }>();

    const mockPrisma = {
      otpAttempt: {
        deleteMany: async (args: any) => {
          const ltTime = args.where.firstAttemptAt.lt.getTime();
          for (const [phone, record] of mockDbAttempts.entries()) {
            if (record.firstAttemptAt.getTime() < ltTime) {
              mockDbAttempts.delete(phone);
            }
          }
        },
        upsert: async (args: any) => {
          const phone = args.where.phone;
          const existing = mockDbAttempts.get(phone);
          if (!existing) {
            const newRecord = { phone, attempts: 1, firstAttemptAt: args.create.firstAttemptAt };
            mockDbAttempts.set(phone, newRecord);
            return newRecord;
          } else {
            existing.attempts += 1;
            return existing;
          }
        }
      }
    } as any;

    const mockAuthService = {} as any;
    const controller = new AuthController(mockAuthService, mockPrisma);

    const testPhone = "8887776665";

    // 1. First 5 attempts should succeed
    for (let i = 1; i <= 5; i++) {
      await controller['checkAndIncrementOtpAttempts'](testPhone);
    }
    console.log("✅ First 5 database attempts succeeded.");

    // 2. 6th attempt should fail
    await assert.rejects(
      async () => {
        await controller['checkAndIncrementOtpAttempts'](testPhone);
      },
      (err: any) => {
        assert(err instanceof BadRequestException);
        assert.equal(err.message, "Too many OTP attempts. Please try again after 15 minutes.");
        console.log("✅ 6th database attempt correctly blocked.");
        return true;
      }
    );

    // 3. Simulate passage of 16 minutes by modifying firstAttemptAt in mock database
    const record = mockDbAttempts.get(testPhone);
    if (record) {
      record.firstAttemptAt = new Date(Date.now() - 16 * 60 * 1000);
    }

    // 4. Next attempt should now succeed (deleteMany will remove it first, then upsert creates fresh with 1 attempt)
    await controller['checkAndIncrementOtpAttempts'](testPhone);
    console.log("✅ 7th database attempt after 16 minutes succeeded (window successfully reset).");
  }

  // Restore env
  process.env.CODSHIELD_DEMO_MODE = originalDemoMode;

  console.log("=== ALL OTP RATE-LIMIT WINDOW RESET TESTS PASSED ===");
}

testOtpWindowReset().catch((err) => {
  console.error("❌ OTP rate-limit window reset test failed:", err);
  process.exit(1);
});
