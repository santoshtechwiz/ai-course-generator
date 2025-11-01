-- Add quiz status tracking to Chapter table

-- Drop existing index that doesn't include quiz columns
DROP INDEX IF EXISTS "Chapter_videoStatus_summaryStatus_idx";

-- Add new columns for quiz status tracking
ALTER TABLE "Chapter" ADD COLUMN "quizStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Chapter" ADD COLUMN "quizGeneratedAt" TIMESTAMP(3);

-- Create new indexes optimized for quiz status queries
CREATE INDEX "Chapter_quizStatus_summaryStatus_idx" ON "Chapter"("quizStatus", "summaryStatus");
CREATE INDEX "Chapter_videoStatus_idx" ON "Chapter"("videoStatus");
