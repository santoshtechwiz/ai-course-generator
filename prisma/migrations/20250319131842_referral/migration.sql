/*
  Warnings:

  - You are about to drop the `_CourseTagToCourseToTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CourseTagToCourseToTag" DROP CONSTRAINT "_CourseTagToCourseToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_CourseTagToCourseToTag" DROP CONSTRAINT "_CourseTagToCourseToTag_B_fkey";

-- DropTable
DROP TABLE "_CourseTagToCourseToTag";

-- CreateTable
CREATE TABLE "TokenTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReferral" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReferralUse" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "planId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReferralUse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TokenTransaction_userId_idx" ON "TokenTransaction"("userId");

-- CreateIndex
CREATE INDEX "TokenTransaction_type_idx" ON "TokenTransaction"("type");

-- CreateIndex
CREATE INDEX "TokenTransaction_createdAt_idx" ON "TokenTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserReferral_userId_key" ON "UserReferral"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserReferral_referralCode_key" ON "UserReferral"("referralCode");

-- CreateIndex
CREATE INDEX "UserReferral_referralCode_idx" ON "UserReferral"("referralCode");

-- CreateIndex
CREATE INDEX "UserReferralUse_referralId_idx" ON "UserReferralUse"("referralId");

-- CreateIndex
CREATE INDEX "UserReferralUse_referrerId_idx" ON "UserReferralUse"("referrerId");

-- CreateIndex
CREATE INDEX "UserReferralUse_referredId_idx" ON "UserReferralUse"("referredId");

-- CreateIndex
CREATE INDEX "UserReferralUse_status_idx" ON "UserReferralUse"("status");

-- CreateIndex
CREATE INDEX "UserReferralUse_createdAt_idx" ON "UserReferralUse"("createdAt");

-- AddForeignKey
ALTER TABLE "CourseToTag" ADD CONSTRAINT "CourseToTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "CourseTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenTransaction" ADD CONSTRAINT "TokenTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReferral" ADD CONSTRAINT "UserReferral_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReferralUse" ADD CONSTRAINT "UserReferralUse_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReferralUse" ADD CONSTRAINT "UserReferralUse_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReferralUse" ADD CONSTRAINT "UserReferralUse_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "UserReferral"("id") ON DELETE CASCADE ON UPDATE CASCADE;
