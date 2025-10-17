-- ============================================
-- COMPREHENSIVE MIGRATION VERIFICATION SCRIPT
-- Ensures NO DATA LOSS and ALL MIGRATIONS CAPTURED
-- ============================================

-- ==========================================
-- PART 1: VERIFY EXISTING DATA PRESERVED
-- ==========================================

-- Check User table data integrity
SELECT 
  COUNT(*) as total_users,
  COUNT(DISTINCT id) as unique_users,
  COUNT(email) as users_with_email,
  COUNT(name) as users_with_name
FROM "User";

-- Verify User streak fields with defaults applied
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN streak IS NOT NULL THEN 1 END) as users_with_streak,
  COUNT(CASE WHEN "longestStreak" IS NOT NULL THEN 1 END) as users_with_longest_streak,
  COUNT(CASE WHEN "lastReviewDate" IS NOT NULL THEN 1 END) as users_with_last_review_date,
  COUNT(CASE WHEN "notificationSettings" IS NOT NULL THEN 1 END) as users_with_notification_settings,
  AVG(streak) as avg_streak,
  MAX(streak) as max_streak,
  MAX("longestStreak") as max_longest_streak
FROM "User";

-- Check FlashCardReview data integrity
SELECT 
  COUNT(*) as total_reviews,
  COUNT(DISTINCT "flashCardId") as unique_cards_reviewed,
  COUNT(DISTINCT "userId") as unique_users_reviewing,
  MIN("reviewDate") as earliest_review,
  MAX("reviewDate") as latest_review
FROM "FlashCardReview";

-- Verify FlashCardReview SM-2 fields with defaults applied
SELECT 
  COUNT(*) as total_reviews,
  COUNT(CASE WHEN "easeFactor" IS NOT NULL THEN 1 END) as reviews_with_ease_factor,
  COUNT(CASE WHEN interval IS NOT NULL THEN 1 END) as reviews_with_interval,
  AVG("easeFactor"::numeric) as avg_ease_factor,
  AVG(interval) as avg_interval,
  COUNT(CASE WHEN "easeFactor" = 2.5 THEN 1 END) as reviews_with_default_ease_factor,
  COUNT(CASE WHEN interval = 0 THEN 1 END) as reviews_with_default_interval
FROM "FlashCardReview";

-- Check FlashCard data integrity (no changes expected)
SELECT 
  COUNT(*) as total_flashcards,
  COUNT(DISTINCT "userId") as unique_card_creators,
  COUNT(DISTINCT "deckId") as unique_decks
FROM "FlashCard";

-- Verify no duplicate records were created
SELECT 
  "userId", 
  email, 
  COUNT(*) as duplicate_count
FROM "User"
GROUP BY "userId", email
HAVING COUNT(*) > 1;

-- ==========================================
-- PART 2: VERIFY NEW TABLES EXIST
-- ==========================================

-- Check all new tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('Badge', 'UserBadge', 'Leaderboard', 'EmailQueue', 'UsageLimit', 'PushSubscription')
ORDER BY table_name;

-- ==========================================
-- PART 3: VERIFY BADGE SYSTEM
-- ==========================================

-- Check Badge table seeded correctly
SELECT 
  category,
  tier,
  COUNT(*) as badge_count
FROM "Badge"
GROUP BY category, tier
ORDER BY category, tier;

-- Verify all 17 badges exist
SELECT COUNT(*) as total_badges FROM "Badge";
-- Expected: 17

-- List all badges by category
SELECT 
  id,
  name,
  category,
  tier,
  "requiredValue",
  icon
FROM "Badge"
ORDER BY category, "requiredValue";

-- Check UserBadge table structure (should be empty initially)
SELECT COUNT(*) as user_badges_unlocked FROM "UserBadge";

-- ==========================================
-- PART 4: VERIFY INDEXES EXIST
-- ==========================================

-- Check User table indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'User'
  AND indexname IN ('User_streak_idx', 'User_lastReviewDate_idx')
ORDER BY indexname;

-- Check FlashCardReview table indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'FlashCardReview'
  AND indexname IN ('FlashCardReview_easeFactor_idx', 'FlashCardReview_interval_idx')
ORDER BY indexname;

-- Check Badge table indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'Badge'
ORDER BY indexname;

-- ==========================================
-- PART 5: VERIFY FOREIGN KEYS
-- ==========================================

-- Check UserBadge foreign keys
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table,
  a.attname as column_name,
  af.attname as referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE conname IN ('UserBadge_userId_fkey', 'UserBadge_badgeId_fkey')
ORDER BY conname;

-- Check Leaderboard foreign keys
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint c
WHERE conname = 'Leaderboard_userId_fkey';

-- Check EmailQueue foreign keys
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint c
WHERE conname = 'EmailQueue_userId_fkey';

-- Check UsageLimit foreign keys
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint c
WHERE conname = 'UsageLimit_userId_fkey';

-- ==========================================
-- PART 6: VERIFY UNIQUE CONSTRAINTS
-- ==========================================

-- Check unique constraints on new tables
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
WHERE contype = 'u'
  AND conrelid::regclass::text IN ('Badge', 'UserBadge', 'Leaderboard', 'UsageLimit', 'PushSubscription')
ORDER BY table_name, constraint_name;

-- ==========================================
-- PART 7: DATA CONSISTENCY CHECKS
-- ==========================================

-- Verify no NULL values in required User fields (with defaults)
SELECT 
  COUNT(*) as users_with_null_streak
FROM "User"
WHERE streak IS NULL;
-- Expected: 0

SELECT 
  COUNT(*) as users_with_null_longest_streak
FROM "User"
WHERE "longestStreak" IS NULL;
-- Expected: 0

-- Verify no NULL values in required FlashCardReview fields (with defaults)
SELECT 
  COUNT(*) as reviews_with_null_ease_factor
FROM "FlashCardReview"
WHERE "easeFactor" IS NULL;
-- Expected: 0

SELECT 
  COUNT(*) as reviews_with_null_interval
FROM "FlashCardReview"
WHERE interval IS NULL;
-- Expected: 0

-- ==========================================
-- PART 8: MIGRATION HISTORY
-- ==========================================

-- Check Prisma migration records
SELECT 
  id,
  checksum,
  finished_at,
  migration_name,
  applied_steps_count
FROM "_prisma_migrations"
WHERE migration_name LIKE '%flashcard%'
ORDER BY finished_at DESC;

-- ==========================================
-- PART 9: SAMPLE DATA VERIFICATION
-- ==========================================

-- Show sample User with new fields
SELECT 
  id,
  name,
  email,
  streak,
  "longestStreak",
  "lastReviewDate",
  "notificationSettings",
  "userType",
  "createdAt"
FROM "User"
LIMIT 3;

-- Show sample FlashCardReview with new fields
SELECT 
  id,
  "flashCardId",
  "userId",
  rating,
  "reviewDate",
  "nextReviewDate",
  "easeFactor",
  interval,
  "reviewCount"
FROM "FlashCardReview"
ORDER BY "reviewDate" DESC
LIMIT 5;

-- Show all badges grouped by category
SELECT 
  category,
  STRING_AGG(name || ' (' || tier || ')', ', ' ORDER BY "requiredValue") as badges
FROM "Badge"
GROUP BY category;

-- ==========================================
-- PART 10: SUMMARY REPORT
-- ==========================================

-- Generate summary statistics
SELECT 
  'MIGRATION SUMMARY' as report_section,
  (SELECT COUNT(*) FROM "User") as total_users,
  (SELECT COUNT(*) FROM "FlashCard") as total_flashcards,
  (SELECT COUNT(*) FROM "FlashCardReview") as total_reviews,
  (SELECT COUNT(*) FROM "Badge") as total_badges,
  (SELECT COUNT(*) FROM "UserBadge") as total_user_badges,
  (SELECT COUNT(*) FROM "Leaderboard") as total_leaderboard_entries,
  (SELECT COUNT(*) FROM "EmailQueue") as total_queued_emails,
  (SELECT COUNT(*) FROM "UsageLimit") as total_usage_limit_records,
  (SELECT COUNT(*) FROM "PushSubscription") as total_push_subscriptions;

-- ==========================================
-- EXPECTED RESULTS:
-- ==========================================
-- ✅ All User records preserved with streak fields (default 0)
-- ✅ All FlashCardReview records preserved with SM-2 fields (easeFactor=2.5, interval=0)
-- ✅ 17 badges seeded in Badge table
-- ✅ All 6 new tables exist (Badge, UserBadge, Leaderboard, EmailQueue, UsageLimit, PushSubscription)
-- ✅ All indexes created successfully
-- ✅ All foreign key constraints in place
-- ✅ No NULL values in required fields
-- ✅ No duplicate records created
-- ✅ Migration record exists in _prisma_migrations
-- ==========================================
