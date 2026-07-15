import 'dotenv/config';
import { strict as assert } from 'assert';
import { AuthController } from '../auth.controller';

async function testVerifiedPhoneExpiry() {
  console.log("=== STARTING VERIFIED PHONE EXPIRY & PRUNE TESTS ===");

  const originalDemoMode = process.env.CODSHIELD_DEMO_MODE;

  // ==========================================
  // Test Case 1: Expiry Verification
  // ==========================================
  {
    console.log("Testing expiry checking in Demo mode...");
    process.env.CODSHIELD_DEMO_MODE = 'true';

    const mockAuthService = {} as any;
    const mockPrisma = {} as any;
    const controller = new AuthController(mockAuthService, mockPrisma);

    const testPhone = "9876543210";

    // 1. Add phone
    await controller['addVerifiedPhone'](testPhone);

    // 2. Artificially expire the record
    const { demoVerifiedPhones } = require('../auth.controller');
    demoVerifiedPhones.set(testPhone.trim(), Date.now() - 5000); // 5s ago

    // 3. Try to consume it (should return false because it's expired)
    const res = await controller['consumeVerifiedPhone'](testPhone);
    assert.equal(res, false);
    console.log("✅ Expired verified phone correctly rejected on consume.");
  }

  // ==========================================
  // Test Case 2: Pruning Sweep Verification
  // ==========================================
  {
    console.log("Testing pruning sweep...");
    process.env.CODSHIELD_DEMO_MODE = 'true';

    const mockAuthService = {} as any;
    const mockPrisma = {} as any;
    const controller = new AuthController(mockAuthService, mockPrisma);

    const { demoVerifiedPhones } = require('../auth.controller');
    demoVerifiedPhones.clear();

    // 1. Add an expired phone number directly
    demoVerifiedPhones.set("1111111111", Date.now() - 10000); // expired
    // 2. Add a valid phone number directly
    demoVerifiedPhones.set("2222222222", Date.now() + 10 * 60 * 1000); // valid

    assert.equal(demoVerifiedPhones.has("1111111111"), true);
    assert.equal(demoVerifiedPhones.has("2222222222"), true);

    // 3. Add a new phone number using the controller method (should trigger sweep)
    await controller['addVerifiedPhone']("3333333333");

    // 4. Assert that "1111111111" has been pruned, but "2222222222" and "3333333333" remain
    assert.equal(demoVerifiedPhones.has("1111111111"), false, "Expired verified phone should be pruned.");
    assert.equal(demoVerifiedPhones.has("2222222222"), true, "Valid verified phone should not be pruned.");
    assert.equal(demoVerifiedPhones.has("3333333333"), true, "New verified phone should be present.");

    console.log("✅ Pruning sweep successfully cleared expired verified phones.");
  }

  // Restore env
  process.env.CODSHIELD_DEMO_MODE = originalDemoMode;

  console.log("=== ALL VERIFIED PHONE EXPIRY & PRUNE TESTS PASSED ===");
}

testVerifiedPhoneExpiry().catch((err) => {
  console.error("❌ Verified phone expiry test failed:", err);
  process.exit(1);
});
