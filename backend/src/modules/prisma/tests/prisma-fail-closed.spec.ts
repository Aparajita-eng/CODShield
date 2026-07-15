import 'dotenv/config';
import { strict as assert } from 'assert';
import { PrismaService } from '../prisma.service';

async function testPrismaFailClosed() {
  console.log("=== STARTING PRISMA FAIL-CLOSED BOOTSTRAP UNIT TEST ===");

  // Ensure CODSHIELD_DEMO_MODE is not true to simulate production environment
  const originalDemoMode = process.env.CODSHIELD_DEMO_MODE;
  process.env.CODSHIELD_DEMO_MODE = 'false';
  process.env.DATABASE_URL = 'postgresql://invalid_user:invalid_pass@localhost:54321/invalid_db';

  const prismaService = new PrismaService();

  await assert.rejects(
    async () => {
      await prismaService.onModuleInit();
    },
    (err: any) => {
      console.log("✅ Received expected connection failure error:", err.message || err);
      return true;
    }
  );

  // Restore environment variables
  process.env.CODSHIELD_DEMO_MODE = originalDemoMode;

  console.log("✅ Prisma fail-closed test passed successfully!");
}

testPrismaFailClosed().catch((err) => {
  console.error("❌ Prisma fail-closed test failed:", err);
  process.exit(1);
});
