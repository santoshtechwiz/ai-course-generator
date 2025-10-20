-- ============================================
-- Add All Share Columns to Course and UserQuiz
-- Safe migration with zero data loss
-- ============================================

-- Add share columns to Course table if they don't exist
ALTER TABLE "Course" 
ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'private',
ADD COLUMN IF NOT EXISTS "share_token" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "share_key_hash" TEXT,
ADD COLUMN IF NOT EXISTS "share_expiry" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "share_views" INTEGER NOT NULL DEFAULT 0;

-- Add share columns to UserQuiz table if they don't exist
ALTER TABLE "UserQuiz" 
ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'private',
ADD COLUMN IF NOT EXISTS "share_token" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "share_key_hash" TEXT,
ADD COLUMN IF NOT EXISTS "share_expiry" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "share_views" INTEGER NOT NULL DEFAULT 0;

-- Create unique constraints for share_token if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Course_share_token_key'
  ) THEN
    ALTER TABLE "Course" ADD CONSTRAINT "Course_share_token_key" UNIQUE ("share_token");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserQuiz_share_token_key'
  ) THEN
    ALTER TABLE "UserQuiz" ADD CONSTRAINT "UserQuiz_share_token_key" UNIQUE ("share_token");
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "Course_visibility_idx" ON "Course"("visibility");
CREATE INDEX IF NOT EXISTS "Course_share_token_idx" ON "Course"("share_token");
CREATE INDEX IF NOT EXISTS "Course_share_expiry_idx" ON "Course"("share_expiry");
CREATE INDEX IF NOT EXISTS "UserQuiz_visibility_idx" ON "UserQuiz"("visibility");
CREATE INDEX IF NOT EXISTS "UserQuiz_share_token_idx" ON "UserQuiz"("share_token");
CREATE INDEX IF NOT EXISTS "UserQuiz_share_expiry_idx" ON "UserQuiz"("share_expiry");

-- Add comments for documentation
COMMENT ON COLUMN "Course"."visibility" IS 'Course visibility level: private, link-only, or public';
COMMENT ON COLUMN "Course"."share_token" IS 'Unique token for sharing this course';
COMMENT ON COLUMN "Course"."share_key_hash" IS 'Hash of access key for additional security (optional)';
COMMENT ON COLUMN "Course"."share_expiry" IS 'Optional expiration date for the share link';
COMMENT ON COLUMN "Course"."share_views" IS 'Count of views through share link';

COMMENT ON COLUMN "UserQuiz"."visibility" IS 'Quiz visibility level: private, link-only, or public';
COMMENT ON COLUMN "UserQuiz"."share_token" IS 'Unique token for sharing this quiz';
COMMENT ON COLUMN "UserQuiz"."share_key_hash" IS 'Hash of access key for additional security (optional)';
COMMENT ON COLUMN "UserQuiz"."share_expiry" IS 'Optional expiration date for the share link';
COMMENT ON COLUMN "UserQuiz"."share_views" IS 'Count of views through share link';
