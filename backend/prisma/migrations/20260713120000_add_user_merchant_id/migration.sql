-- AlterTable: add User.merchantId for databases created before this FK existed
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "merchantId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_merchantId_idx" ON "User"("merchantId");

-- AddForeignKey (idempotent guard via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_merchantId_fkey'
  ) THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_merchantId_fkey"
      FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill: link users to merchants by companyName (legacy resolution)
UPDATE "User" u
SET "merchantId" = m."id"
FROM "Merchant" m
WHERE u."companyName" = m."name"
  AND u."merchantId" IS NULL;

-- Explicit demo user → Acme (seed companyName does not match any merchant name)
UPDATE "User" u
SET "merchantId" = m."id"
FROM "Merchant" m
WHERE u."email" = 'demo@codshield.com'
  AND m."name" = 'Acme Apparel'
  AND u."merchantId" IS NULL;
