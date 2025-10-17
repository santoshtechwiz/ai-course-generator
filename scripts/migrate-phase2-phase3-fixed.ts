import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createBadgeTable() {
  console.log('📋 Creating Badge tables...')
  
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
  
  // Add foreign key for userId
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
  
  // Add foreign key for badgeId
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
  console.log('🌱 Seeding badges...')
  
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
    { id: 'early-bird', name: 'Early Bird', description: 'Review flashcards before 8 AM', category: 'special', icon: '🌅', requiredValue: 1, tier: 'silver' },
    { id: 'night-owl', name: 'Night Owl', description: 'Review flashcards after 10 PM', category: 'special', icon: '🦉', requiredValue: 1, tier: 'silver' },
    { id: 'comeback', name: 'Comeback', description: 'Start a new streak after breaking one', category: 'special', icon: '💪', requiredValue: 1, tier: 'bronze' },
  ]

  for (const badge of badges) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Badge" (id, name, description, category, icon, "requiredValue", tier)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      badge.id,
      badge.name,
      badge.description,
      badge.category,
      badge.icon,
      badge.requiredValue,
      badge.tier
    )
  }

  console.log(`✅ Seeded ${badges.length} badges`)
}

async function createLeaderboardTable() {
  console.log('📋 Creating Leaderboard table...')
  
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Leaderboard" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "value" INTEGER NOT NULL,
      "rank" INTEGER,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Leaderboard_userId_type_key" UNIQUE ("userId", "type")
    )
  `)
  
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Leaderboard_type_value_idx" ON "Leaderboard"("type", "value" DESC)`)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Leaderboard_userId_idx" ON "Leaderboard"("userId")`)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Leaderboard_rank_idx" ON "Leaderboard"("rank")`)
  
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Leaderboard_userId_fkey'
      ) THEN
        ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `)

  console.log('✅ Leaderboard table created')
}

async function createNotificationTable() {
  console.log('📋 Creating PushSubscription table...')
  
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PushSubscription" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "endpoint" TEXT NOT NULL,
      "p256dh" TEXT NOT NULL,
      "auth" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PushSubscription_endpoint_key" UNIQUE ("endpoint")
    )
  `)
  
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId")`)
  
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PushSubscription_userId_fkey'
      ) THEN
        ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `)

  console.log('✅ PushSubscription table created')
}

async function createEmailQueueTable() {
  console.log('📋 Creating EmailQueue table...')
  
  await prisma.$executeRawUnsafe(`
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
    )
  `)
  
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EmailQueue_userId_idx" ON "EmailQueue"("userId")`)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EmailQueue_status_idx" ON "EmailQueue"("status")`)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EmailQueue_scheduledFor_idx" ON "EmailQueue"("scheduledFor")`)
  
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'EmailQueue_userId_fkey'
      ) THEN
        ALTER TABLE "EmailQueue" ADD CONSTRAINT "EmailQueue_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `)

  console.log('✅ EmailQueue table created')
}

async function createUsageLimitTable() {
  console.log('📋 Creating UsageLimit table...')
  
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UsageLimit" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "resourceType" TEXT NOT NULL,
      "usedCount" INTEGER NOT NULL DEFAULT 0,
      "limitCount" INTEGER NOT NULL,
      "periodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "periodEnd" TIMESTAMP(3) NOT NULL,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "UsageLimit_userId_resourceType_key" UNIQUE ("userId", "resourceType")
    )
  `)
  
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UsageLimit_userId_idx" ON "UsageLimit"("userId")`)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UsageLimit_resourceType_idx" ON "UsageLimit"("resourceType")`)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UsageLimit_periodEnd_idx" ON "UsageLimit"("periodEnd")`)
  
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UsageLimit_userId_fkey'
      ) THEN
        ALTER TABLE "UsageLimit" ADD CONSTRAINT "UsageLimit_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `)

  console.log('✅ UsageLimit table created')
}

async function main() {
  try {
    console.log('🚀 Starting Phase 2 & 3 migrations...\n')

    await createBadgeTable()
    await seedBadges()
    await createLeaderboardTable()
    await createNotificationTable()
    await createEmailQueueTable()
    await createUsageLimitTable()

    console.log('\n✅ All migrations completed successfully!')
    console.log('📊 Summary:')
    console.log('  - Badge system (Badge, UserBadge)')
    console.log('  - 17 achievement badges seeded')
    console.log('  - Leaderboard system')
    console.log('  - Push notification subscriptions')
    console.log('  - Email queue for scheduled notifications')
    console.log('  - Usage limits for free tier enforcement')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
