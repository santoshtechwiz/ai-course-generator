-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "viewCount" DROP NOT NULL;

-- CreateTable
CREATE TABLE "UserTopicProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "averageTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difficultyLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "masteryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTopicProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserTopicProgress_userId_idx" ON "UserTopicProgress"("userId");

-- CreateIndex
CREATE INDEX "UserTopicProgress_topic_idx" ON "UserTopicProgress"("topic");

-- CreateIndex
CREATE INDEX "UserTopicProgress_masteryScore_idx" ON "UserTopicProgress"("masteryScore");

-- CreateIndex
CREATE UNIQUE INDEX "UserTopicProgress_userId_topic_key" ON "UserTopicProgress"("userId", "topic");
