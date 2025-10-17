import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createBadgeTable() {
  // Create Badge table
  await prisma.$executeRawUnsafe(`
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
    )
  `)
  
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Badge_category_idx" ON "Badge"("category")`)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Badge_tier_idx" ON "Badge"("tier")`)

  // Create UserBadge table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserBadge" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "badgeId" TEXT NOT NULL,
      "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "progress" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "UserBadge_userId_badgeId_key" UNIQUE ("userId", "badgeId")
    )
  `)
  
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UserBadge_userId_idx" ON "UserBadge"("userId")`)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UserBadge_badgeId_idx" ON "UserBadge"("badgeId")`)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UserBadge_unlockedAt_idx" ON "UserBadge"("unlockedAt")`)
  
  // Add foreign keys
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UserBadge_userId_fkey'
      ) THEN
        ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `)
  
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UserBadge_badgeId_fkey'
      ) THEN
        ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" 
        FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `)

  console.log('✅ Badge tables created successfully')
}

async function seedBadges() {
  const badges = [
    // Streak Badges
    { id: 'streak-7', name: '7-Day Streak', description: 'Review flashcards for 7 consecutive days', category: 'streak', icon: '🔥', requiredValue: 7, tier: 'bronze' },
    { id: 'streak-30', name: '30-Day Streak', description: 'Review flashcards for 30 consecutive days', category: 'streak', icon: '🔥', requiredValue: 30, tier: 'silver' },
    { id: 'streak-100', name: '100-Day Streak', description: 'Review flashcards for 100 consecutive days', category: 'streak', icon: '🔥', requiredValue: 100, tier: 'gold' },
    { id: 'streak-365', name: '365-Day Streak', description: 'Review flashcards for a full year!', category: 'streak', icon: '👑', requiredValue: 365, tier: 'platinum' },
    
    // Review Count Badges
    { id: 'reviews-10', name: 'First 10 Reviews', description: 'Complete 10 flashcard reviews', category: 'reviews', icon: '📚', requiredValue: 10, tier: 'bronze' },
    { id: 'reviews-50', name: '50 Reviews', description: 'Complete 50 flashcard reviews', category: 'reviews', icon: '📚', requiredValue: 50, tier: 'silver' },
    { id: 'reviews-100', name: '100 Reviews', description: 'Complete 100 flashcard reviews', category: 'reviews', icon: '📖', requiredValue: 100, tier: 'gold' },
    { id: 'reviews-500', name: '500 Reviews', description: 'Complete 500 flashcard reviews', category: 'reviews', icon: '📘', requiredValue: 500, tier: 'platinum' },
    { id: 'reviews-1000', name: '1000 Reviews', description: 'Complete 1000 flashcard reviews - Master Scholar!', category: 'reviews', icon: '🎓', requiredValue: 1000, tier: 'diamond' },
    
    // Mastery Badges
    { id: 'mastery-5', name: 'First Masteries', description: 'Master 5 flashcards', category: 'mastery', icon: '🧠', requiredValue: 5, tier: 'bronze' },
    { id: 'mastery-25', name: '25 Masteries', description: 'Master 25 flashcards', category: 'mastery', icon: '🧠', requiredValue: 25, tier: 'silver' },
    { id: 'mastery-50', name: '50 Masteries', description: 'Master 50 flashcards', category: 'mastery', icon: '🎯', requiredValue: 50, tier: 'gold' },
    { id: 'mastery-100', name: '100 Masteries', description: 'Master 100 flashcards', category: 'mastery', icon: '💎', requiredValue: 100, tier: 'platinum' },
    
    // Special Achievement Badges
    { id: 'perfect-day', name: 'Perfect Day', description: 'Review all due cards in a single day', category: 'special', icon: '⭐', requiredValue: 1, tier: 'gold' },
    { id: 'early-bird', name: 'Early Bird', description: 'Complete reviews before 8 AM', category: 'special', icon: '🌅', requiredValue: 5, tier: 'silver' },
    { id: 'night-owl', name: 'Night Owl', description: 'Complete reviews after 10 PM', category: 'special', icon: '🦉', requiredValue: 5, tier: 'silver' },
    { id: 'comeback', name: 'Comeback', description: 'Restart your streak after a 7+ day break', category: 'special', icon: '💪', requiredValue: 1, tier: 'bronze' },
  ]

  for (const badge of badges) {
    await prisma.$executeRaw`
      INSERT INTO "Badge" ("id", "name", "description", "category", "icon", "requiredValue", "tier", "createdAt")
      VALUES (${badge.id}, ${badge.name}, ${badge.description}, ${badge.category}, ${badge.icon}, ${badge.requiredValue}, ${badge.tier}, NOW())
      ON CONFLICT ("id") DO NOTHING
    `
  }

  console.log(`✅ Seeded ${badges.length} badges`)
}

async function createLeaderboardTable() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "Leaderboard" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "value" INTEGER NOT NULL,
      "rank" INTEGER,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Leaderboard_userId_type_key" UNIQUE ("userId", "type")
    );
    
    CREATE INDEX IF NOT EXISTS "Leaderboard_type_value_idx" ON "Leaderboard"("type", "value" DESC);
    CREATE INDEX IF NOT EXISTS "Leaderboard_userId_idx" ON "Leaderboard"("userId");
    CREATE INDEX IF NOT EXISTS "Leaderboard_rank_idx" ON "Leaderboard"("rank");
    
    -- Add foreign key
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Leaderboard_userId_fkey'
      ) THEN
        ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `

  console.log('✅ Leaderboard table created')
}

async function createNotificationTable() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "PushSubscription" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "endpoint" TEXT NOT NULL,
      "keys" JSONB NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastUsed" TIMESTAMP(3),
      CONSTRAINT "PushSubscription_endpoint_key" UNIQUE ("endpoint")
    );
    
    CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");
    
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PushSubscription_userId_fkey'
      ) THEN
        ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "EmailQueue" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "data" JSONB NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "attempts" INTEGER NOT NULL DEFAULT 0,
      "scheduledFor" TIMESTAMP(3) NOT NULL,
      "sentAt" TIMESTAMP(3),
      "error" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS "EmailQueue_userId_idx" ON "EmailQueue"("userId");
    CREATE INDEX IF NOT EXISTS "EmailQueue_status_idx" ON "EmailQueue"("status");
    CREATE INDEX IF NOT EXISTS "EmailQueue_scheduledFor_idx" ON "EmailQueue"("scheduledFor");
    CREATE INDEX IF NOT EXISTS "EmailQueue_type_idx" ON "EmailQueue"("type");
    
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'EmailQueue_userId_fkey'
      ) THEN
        ALTER TABLE "EmailQueue" ADD CONSTRAINT "EmailQueue_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `

  console.log('✅ Notification tables created')
}

async function createUsageLimitsTable() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "UsageLimit" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "resourceType" TEXT NOT NULL,
      "usedCount" INTEGER NOT NULL DEFAULT 0,
      "limitCount" INTEGER NOT NULL,
      "periodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "periodEnd" TIMESTAMP(3) NOT NULL,
      "resetFrequency" TEXT NOT NULL DEFAULT 'daily',
      CONSTRAINT "UsageLimit_userId_resourceType_key" UNIQUE ("userId", "resourceType")
    );
    
    CREATE INDEX IF NOT EXISTS "UsageLimit_userId_idx" ON "UsageLimit"("userId");
    CREATE INDEX IF NOT EXISTS "UsageLimit_resourceType_idx" ON "UsageLimit"("resourceType");
    CREATE INDEX IF NOT EXISTS "UsageLimit_periodEnd_idx" ON "UsageLimit"("periodEnd");
    
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UsageLimit_userId_fkey'
      ) THEN
        ALTER TABLE "UsageLimit" ADD CONSTRAINT "UsageLimit_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `

  console.log('✅ UsageLimit table created')
}

async function main() {
  try {
    console.log('🚀 Starting Phase 2 & 3 migrations...')
    
    await createBadgeTable()
    await seedBadges()
    await createLeaderboardTable()
    await createNotificationTable()
    await createUsageLimitsTable()
    
    console.log('✅ All migrations completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
