-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hadPreviousPaidPlan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasUsedFreePlan" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "User_hadPreviousPaidPlan_idx" ON "User"("hadPreviousPaidPlan");

-- CreateIndex
CREATE INDEX "User_hasUsedFreePlan_idx" ON "User"("hasUsedFreePlan");
