import 'dotenv/config';
import { strict as assert } from 'assert';
import { AuthController } from '../auth.controller';
import { ServiceUnavailableException } from '@nestjs/common';

/**
 * Runtime DB Failure Test
 *
 * Uses the correct Prisma error class for a lost connection:
 * - PrismaClientUnknownRequestError: covers dropped connections mid-request
 *   (no known errorCode, which is how Prisma surfaces a socket-level drop).
 * - The original mock threw generic `new Error(...)`, which is NOT the shape
 *   the controller catches. The controller must catch Prisma error instances
 *   to correctly return 503; a plain Error would produce 500.
 *
 * How to verify Prisma error class is real:
 *   node -e "const m = require('./node_modules/@prisma/client/runtime/client');
 *            console.log(typeof m.PrismaClientUnknownRequestError)"
 * Output: "function"
 */

// Import the real Prisma error classes from the runtime bundle
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PrismaRuntime = require('../../../../../node_modules/@prisma/client/runtime/client');
const PrismaClientUnknownRequestError: typeof import('@prisma/client/runtime/library').PrismaClientUnknownRequestError
  = PrismaRuntime.PrismaClientUnknownRequestError;

function makePrismaUnknownError(): InstanceType<typeof PrismaClientUnknownRequestError> {
  // PrismaClientUnknownRequestError(message, { clientVersion })
  return new PrismaClientUnknownRequestError(
    'Database connection lost: socket hang up',
    { clientVersion: '6.19.3' }
  );
}

async function testRuntimeDatabaseFailure() {
  console.log('=== STARTING AUTH CONTROLLER RUNTIME DATABASE FAILURE UNIT TEST ===');

  // Enforce production mode to trigger database path
  const originalDemoMode = process.env.CODSHIELD_DEMO_MODE;
  process.env.CODSHIELD_DEMO_MODE = 'false';

  // Mock PrismaService that throws a PrismaClientUnknownRequestError
  // (the actual error shape Prisma emits when a live connection is lost)
  const mockPrismaThrower = {
    otpAttempt: {
      deleteMany: async () => { throw makePrismaUnknownError(); },
      upsert:     async () => { throw makePrismaUnknownError(); },
    },
    passwordResetToken: {
      findUnique: async () => { throw makePrismaUnknownError(); },
      delete:     async () => { throw makePrismaUnknownError(); },
    },
    verifiedPhone: {
      findUnique: async () => { throw makePrismaUnknownError(); },
      delete:     async () => { throw makePrismaUnknownError(); },
    },
  } as any;

  const mockAuthService = {} as any;
  const controller = new AuthController(mockAuthService, mockPrismaThrower);

  // 1. Verify that /api/otp/verify throws 503 on DB runtime failure
  {
    console.log('Testing /api/otp/verify runtime DB failure...');
    await assert.rejects(
      async () => {
        await controller.verifyOtp({ phone: '9876543210', code: '123456' });
      },
      (err: any) => {
        assert(err instanceof ServiceUnavailableException,
          `Expected ServiceUnavailableException, got ${err?.constructor?.name}: ${err?.message}`);
        assert.equal(err.getStatus(), 503);
        assert.equal(err.message, 'Database unavailable. Please try again later.');
        console.log('✅ verifyOtp correctly threw 503 on database failure.');
        return true;
      }
    );
  }

  // 2. Verify that /api/auth/reset-password throws 503 on DB runtime failure
  {
    console.log('Testing /api/auth/reset-password runtime DB failure...');
    await assert.rejects(
      async () => {
        await controller.resetPassword({ token: 'testtoken', newPassword: 'NewPassword@123' });
      },
      (err: any) => {
        assert(err instanceof ServiceUnavailableException,
          `Expected ServiceUnavailableException, got ${err?.constructor?.name}: ${err?.message}`);
        assert.equal(err.getStatus(), 503);
        assert.equal(err.message, 'Database unavailable. Please try again later.');
        console.log('✅ resetPassword correctly threw 503 on database failure.');
        return true;
      }
    );
  }

  // Restore env
  process.env.CODSHIELD_DEMO_MODE = originalDemoMode;

  console.log('=== ALL RUNTIME DATABASE FAILURE TESTS PASSED SUCCESSFULLY ===');
}

testRuntimeDatabaseFailure().catch((err) => {
  console.error('❌ Runtime database failure test failed:', err);
  process.exit(1);
});
