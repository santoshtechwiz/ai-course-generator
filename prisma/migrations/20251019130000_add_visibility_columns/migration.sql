-- ============================================
-- Add Visibility Columns to Course and UserQuiz
-- Safe migration with zero data loss
-- Adds visibility field that was missing from the previous migration
-- ============================================

-- Add visibility column to Course table if it doesn't exist
ALTER TABLE "Course" 
ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'private';

-- Add visibility column to UserQuiz table if it doesn't exist
ALTER TABLE "UserQuiz" 
ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'private';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "Course_visibility_idx" ON "Course"("visibility");
CREATE INDEX IF NOT EXISTS "UserQuiz_visibility_idx" ON "UserQuiz"("visibility");

-- Add comments for documentation
COMMENT ON COLUMN "Course"."visibility" IS 'Course visibility level: private, link-only, or public';
COMMENT ON COLUMN "UserQuiz"."visibility" IS 'Quiz visibility level: private, link-only, or public';
