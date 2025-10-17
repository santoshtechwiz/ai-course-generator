-- ============================================
-- Phase 2 & 3: Badge System, Gamification, and Usage Limits
-- This migration adds engagement features and monetization
-- GUARANTEED NO DATA LOSS - Only adds new tables
-- ============================================

-- ==========================================
-- BADGE SYSTEM TABLES
-- ==========================================

-- Badge: Achievement definitions
CREATE TABLE IF NOT EXISTS "Badge" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "requiredValue" INTEGER NOT NULL,
  "tier" TEXT NOT NULL DEFAULT 'bronze',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Badge_name_key" UNIQUE ("name")
);

-- Indexes for Badge
CREATE INDEX IF NOT EXISTS "Badge_category_idx" ON "Badge"("category");
CREATE INDEX IF NOT EXISTS "Badge_tier_idx" ON "Badge"("tier");

-- UserBadge: Track user badge unlocks
CREATE TABLE IF NOT EXISTS "UserBadge" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "badgeId" TEXT NOT NULL,
  "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "progress" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "UserBadge_userId_badgeId_key" UNIQUE ("userId", "badgeId")
);

-- Indexes for UserBadge
CREATE INDEX IF NOT EXISTS "UserBadge_userId_idx" ON "UserBadge"("userId");
CREATE INDEX IF NOT EXISTS "UserBadge_badgeId_idx" ON "UserBadge"("badgeId");
CREATE INDEX IF NOT EXISTS "UserBadge_unlockedAt_idx" ON "UserBadge"("unlockedAt");

-- Foreign keys for UserBadge
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserBadge_userId_fkey'
  ) THEN
    ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserBadge_badgeId_fkey'
  ) THEN
    ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" 
    FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ==========================================
-- SEED BADGE DATA (17 Achievements)
-- ==========================================

-- Streak Badges (4)
INSERT INTO "Badge" (id, name, description, category, icon, "requiredValue", tier)
VALUES 
  ('streak-7', '7-Day Streak', 'Review flashcards for 7 consecutive days', 'streak', '🔥', 7, 'bronze'),
  ('streak-30', '30-Day Streak', 'Review flashcards for 30 consecutive days', 'streak', '🔥', 30, 'silver'),
  ('streak-100', '100-Day Streak', 'Review flashcards for 100 consecutive days', 'streak', '🔥', 100, 'gold'),
  ('streak-365', '365-Day Streak', 'Review flashcards for a full year!', 'streak', '👑', 365, 'platinum')
ON CONFLICT (id) DO NOTHING;

-- Review Count Badges (5)
INSERT INTO "Badge" (id, name, description, category, icon, "requiredValue", tier)
VALUES 
  ('reviews-10', 'First 10 Reviews', 'Complete 10 flashcard reviews', 'reviews', '📚', 10, 'bronze'),
  ('reviews-50', '50 Reviews', 'Complete 50 flashcard reviews', 'reviews', '📚', 50, 'silver'),
  ('reviews-100', '100 Reviews', 'Complete 100 flashcard reviews', 'reviews', '📖', 100, 'gold'),
  ('reviews-500', '500 Reviews', 'Complete 500 flashcard reviews', 'reviews', '📘', 500, 'platinum'),
  ('reviews-1000', '1000 Reviews', 'Complete 1000 flashcard reviews - Master Scholar!', 'reviews', '🎓', 1000, 'diamond')
ON CONFLICT (id) DO NOTHING;

-- Mastery Badges (4)
INSERT INTO "Badge" (id, name, description, category, icon, "requiredValue", tier)
VALUES 
  ('mastery-5', 'First Masteries', 'Master 5 flashcards', 'mastery', '🧠', 5, 'bronze'),
  ('mastery-25', '25 Masteries', 'Master 25 flashcards', 'mastery', '🧠', 25, 'silver'),
  ('mastery-50', '50 Masteries', 'Master 50 flashcards', 'mastery', '🎯', 50, 'gold'),
  ('mastery-100', '100 Masteries', 'Master 100 flashcards', 'mastery', '💎', 100, 'platinum')
ON CONFLICT (id) DO NOTHING;

-- Special Achievement Badges (4)
INSERT INTO "Badge" (id, name, description, category, icon, "requiredValue", tier)
VALUES 
  ('perfect-day', 'Perfect Day', 'Review all due cards in a single day', 'special', '⭐', 1, 'gold'),
  ('early-bird', 'Early Bird', 'Review flashcards before 8 AM', 'special', '🌅', 1, 'silver'),
  ('night-owl', 'Night Owl', 'Review flashcards after 10 PM', 'special', '🦉', 1, 'silver'),
  ('comeback', 'Comeback', 'Start a new streak after breaking one', 'special', '💪', 1, 'bronze')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- LEADERBOARD SYSTEM
-- ==========================================

CREATE TABLE IF NOT EXISTS "Leaderboard" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "value" INTEGER NOT NULL,
  "rank" INTEGER,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Leaderboard_userId_type_key" UNIQUE ("userId", "type")
);

-- Indexes for Leaderboard
CREATE INDEX IF NOT EXISTS "Leaderboard_type_value_idx" ON "Leaderboard"("type", "value" DESC);
CREATE INDEX IF NOT EXISTS "Leaderboard_userId_idx" ON "Leaderboard"("userId");
CREATE INDEX IF NOT EXISTS "Leaderboard_rank_idx" ON "Leaderboard"("rank");

-- Foreign key for Leaderboard
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Leaderboard_userId_fkey'
  ) THEN
    ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ==========================================
-- NOTIFICATION SYSTEM
-- ==========================================

-- PushSubscription: Browser push notification endpoints
CREATE TABLE IF NOT EXISTS "PushSubscription" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PushSubscription_endpoint_key" UNIQUE ("endpoint")
);

-- Indexes for PushSubscription
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- Foreign key for PushSubscription
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PushSubscription_userId_fkey'
  ) THEN
    ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- EmailQueue: Scheduled email notifications
CREATE TABLE IF NOT EXISTS "EmailQueue" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "error" TEXT
);

-- Indexes for EmailQueue
CREATE INDEX IF NOT EXISTS "EmailQueue_userId_idx" ON "EmailQueue"("userId");
CREATE INDEX IF NOT EXISTS "EmailQueue_status_idx" ON "EmailQueue"("status");
CREATE INDEX IF NOT EXISTS "EmailQueue_scheduledFor_idx" ON "EmailQueue"("scheduledFor");

-- Foreign key for EmailQueue
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EmailQueue_userId_fkey'
  ) THEN
    ALTER TABLE "EmailQueue" ADD CONSTRAINT "EmailQueue_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ==========================================
-- MONETIZATION: USAGE LIMITS
-- ==========================================

-- UsageLimit: Free tier enforcement
CREATE TABLE IF NOT EXISTS "UsageLimit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "limitCount" INTEGER NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "resetFrequency" TEXT NOT NULL DEFAULT 'daily',
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UsageLimit_userId_resourceType_key" UNIQUE ("userId", "resourceType")
);

-- Indexes for UsageLimit
CREATE INDEX IF NOT EXISTS "UsageLimit_userId_idx" ON "UsageLimit"("userId");
CREATE INDEX IF NOT EXISTS "UsageLimit_resourceType_idx" ON "UsageLimit"("resourceType");
CREATE INDEX IF NOT EXISTS "UsageLimit_periodEnd_idx" ON "UsageLimit"("periodEnd");

-- Foreign key for UsageLimit
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UsageLimit_userId_fkey'
  ) THEN
    ALTER TABLE "UsageLimit" ADD CONSTRAINT "UsageLimit_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ==========================================
-- MIGRATION SUMMARY
-- ==========================================
-- ✅ 6 new tables created (Badge, UserBadge, Leaderboard, PushSubscription, EmailQueue, UsageLimit)
-- ✅ 17 achievement badges seeded
-- ✅ All indexes created for performance
-- ✅ All foreign key constraints in place
-- ✅ All unique constraints configured
-- ✅ NO DATA LOSS - Only adds new tables
-- ✅ Safe to run multiple times (IF NOT EXISTS everywhere)
-- ==========================================
