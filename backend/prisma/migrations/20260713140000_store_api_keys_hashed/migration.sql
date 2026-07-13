-- AlterTable
ALTER TABLE "Merchant" DROP COLUMN "apiKey";

-- AlterTable
ALTER TABLE "Merchant" ADD COLUMN     "apiKeyHash" TEXT NOT NULL,
ADD COLUMN     "apiKeyMask" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_apiKeyHash_key" ON "Merchant"("apiKeyHash");
