-- Safe migration with data preservation
-- AlterTable User: Add streak tracking fields with default values (no data loss)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "longestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lastReviewDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "notificationSettings" JSONB DEFAULT '{"pushEnabled":true,"emailDigest":"weekly","streakAlerts":true}';

-- AlterTable FlashCardReview: Add SM-2 spaced repetition fields with defaults (no data loss)
ALTER TABLE "FlashCardReview"
ADD COLUMN IF NOT EXISTS "easeFactor" DECIMAL(3,2) NOT NULL DEFAULT 2.5,
ADD COLUMN IF NOT EXISTS "interval" INTEGER NOT NULL DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "User_streak_idx" ON "User"("streak");
CREATE INDEX IF NOT EXISTS "User_lastReviewDate_idx" ON "User"("lastReviewDate");
CREATE INDEX IF NOT EXISTS "FlashCardReview_easeFactor_idx" ON "FlashCardReview"("easeFactor");
CREATE INDEX IF NOT EXISTS "FlashCardReview_interval_idx" ON "FlashCardReview"("interval");

-- Backfill data for existing FlashCardReviews (safe operation)
-- Set reasonable defaults based on reviewCount
UPDATE "FlashCardReview"
SET 
  "interval" = CASE 
    WHEN "reviewCount" = 1 THEN 1
    WHEN "reviewCount" = 2 THEN 6
    WHEN "reviewCount" >= 3 THEN LEAST(30, "reviewCount" * 3)
    ELSE 0
  END,
  "nextReviewDate" = CASE
    WHEN "nextReviewDate" IS NULL THEN "reviewDate" + (
      CASE 
        WHEN "reviewCount" = 1 THEN INTERVAL '1 day'
        WHEN "reviewCount" = 2 THEN INTERVAL '6 days'
        WHEN "reviewCount" >= 3 THEN (LEAST(30, "reviewCount" * 3) || ' days')::INTERVAL
        ELSE INTERVAL '1 day'
      END
    )
    ELSE "nextReviewDate"
  END
WHERE "easeFactor" = 2.5 AND "interval" = 0;

COMMENT ON COLUMN "User"."streak" IS 'Current consecutive days of flashcard reviews';
COMMENT ON COLUMN "User"."longestStreak" IS 'All-time best streak record';
COMMENT ON COLUMN "User"."lastReviewDate" IS 'Last flashcard review timestamp for streak calculation';
COMMENT ON COLUMN "User"."notificationSettings" IS 'JSON: pushEnabled, emailDigest, streakAlerts preferences';
COMMENT ON COLUMN "FlashCardReview"."easeFactor" IS 'SM-2 ease factor (1.3-2.5+) for adaptive scheduling';
COMMENT ON COLUMN "FlashCardReview"."interval" IS 'Days until next review in SM-2 algorithm';
