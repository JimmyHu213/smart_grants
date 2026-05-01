-- CreateEnum
CREATE TYPE "GrantSource" AS ENUM ('MANUAL', 'CRAWLED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('APPROVED', 'PENDING_REVIEW', 'REJECTED');

-- AlterTable
ALTER TABLE "grants" ADD COLUMN     "crawledAt" TIMESTAMP(3),
ADD COLUMN     "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "source" "GrantSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "sourceUrl" TEXT;

-- CreateIndex
CREATE INDEX "grants_reviewStatus_idx" ON "grants"("reviewStatus");

-- CreateIndex
CREATE UNIQUE INDEX "grants_sourceUrl_key" ON "grants"("sourceUrl");
