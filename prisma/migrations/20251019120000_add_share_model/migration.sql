-- ============================================
-- Add Share Model for Link Management
-- Safe migration with zero data loss
-- Creates dedicated table for sharing functionality
-- ============================================

-- Create Share table for centralized link management
CREATE TABLE IF NOT EXISTS "Share" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "resourceType" TEXT NOT NULL,
  "resourceId" INTEGER NOT NULL,
  "creatorId" TEXT NOT NULL,
  "token" VARCHAR(255) NOT NULL,
  "keyHash" TEXT,
  "expiresAt" TIMESTAMP(3),
  "visibility" TEXT NOT NULL DEFAULT 'link-only',
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Share_token_key" UNIQUE ("token"),
  CONSTRAINT "Share_resourceType_resourceId_token_key" UNIQUE ("resourceType", "resourceId", "token")
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "Share_token_idx" ON "Share"("token");
CREATE INDEX IF NOT EXISTS "Share_creatorId_idx" ON "Share"("creatorId");
CREATE INDEX IF NOT EXISTS "Share_resourceType_resourceId_idx" ON "Share"("resourceType", "resourceId");
CREATE INDEX IF NOT EXISTS "Share_expiresAt_idx" ON "Share"("expiresAt");
CREATE INDEX IF NOT EXISTS "Share_createdAt_idx" ON "Share"("createdAt");

-- Add foreign key constraint for creator
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Share_creatorId_fkey'
  ) THEN
    ALTER TABLE "Share" ADD CONSTRAINT "Share_creatorId_fkey" 
    FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE "Share" IS 'Centralized sharing table for courses and quizzes with token-based access';
COMMENT ON COLUMN "Share"."resourceType" IS 'Type of shared resource: course or quiz';
COMMENT ON COLUMN "Share"."resourceId" IS 'ID of the course or quiz being shared';
COMMENT ON COLUMN "Share"."token" IS 'Unique share token for URL generation';
COMMENT ON COLUMN "Share"."keyHash" IS 'Optional hashed access key for additional security';
COMMENT ON COLUMN "Share"."expiresAt" IS 'Optional expiration date for the share link (null = never expires)';
COMMENT ON COLUMN "Share"."visibility" IS 'Visibility level: link-only or public';
COMMENT ON COLUMN "Share"."viewCount" IS 'Number of times the share link was accessed';
