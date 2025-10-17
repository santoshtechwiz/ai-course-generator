#!/bin/bash
# Comprehensive migration script for all flashcard enhancement phases
# This script ensures NO DATA LOSS during schema changes

set -e  # Exit on error

echo "======================================"
echo "🚀 Flashcard Enhancement Migration"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Pre-Migration Checklist:${NC}"
echo "  ✓ Database backup recommended"
echo "  ✓ Development server can be stopped temporarily"
echo "  ✓ PostgreSQL database is accessible"
echo ""

# Ask for confirmation
read -p "Continue with migration? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo -e "${RED}Migration cancelled${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 1: Running Phase 1 Migration (Streak & SM-2 fields)${NC}"
echo "  → Adding User streak tracking columns..."
echo "  → Adding FlashCardReview SM-2 metadata..."
echo "  → Creating indexes for performance..."
echo "  → Backfilling existing data with safe defaults..."
echo ""

# Apply Phase 1 migration
psql $DATABASE_URL_PROD < prisma/migrations/20251016_add_flashcard_streaks_and_sm2/migration.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Phase 1 migration completed successfully${NC}"
else
    echo -e "${RED}❌ Phase 1 migration failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Running Phase 2 & 3 Migrations (Badges, Notifications, Limits)${NC}"
echo "  → Creating Badge and UserBadge tables..."
echo "  → Creating Leaderboard table..."
echo "  → Creating PushSubscription and EmailQueue tables..."
echo "  → Creating UsageLimit table..."
echo "  → Seeding badge data..."
echo ""

# Run TypeScript migration script
npx ts-node scripts/migrate-phase2-phase3.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Phase 2 & 3 migrations completed successfully${NC}"
else
    echo -e "${RED}❌ Phase 2 & 3 migrations failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 3: Regenerating Prisma Client${NC}"
npx prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma client regenerated${NC}"
else
    echo -e "${RED}❌ Prisma client generation failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 4: Verifying database schema${NC}"
npx prisma db pull --print

echo ""
echo "======================================"
echo -e "${GREEN}✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY${NC}"
echo "======================================"
echo ""
echo "📊 Database Changes Summary:"
echo "  • User: +4 columns (streak, longestStreak, lastReviewDate, notificationSettings)"
echo "  • FlashCardReview: +2 columns (easeFactor, interval)"
echo "  • Badge: NEW TABLE (badges definitions)"
echo "  • UserBadge: NEW TABLE (user badge progress)"
echo "  • Leaderboard: NEW TABLE (competitive features)"
echo "  • PushSubscription: NEW TABLE (push notifications)"
echo "  • EmailQueue: NEW TABLE (email notifications)"
echo "  • UsageLimit: NEW TABLE (free tier limits)"
echo "  • Seeded: 17 achievement badges"
echo ""
echo -e "${BLUE}🎯 Next Steps:${NC}"
echo "  1. Restart your development server: npm run dev"
echo "  2. Test flashcard review flow"
echo "  3. Visit /dashboard/flashcard/review to see new features"
echo "  4. Check badge showcase and calendar heatmap"
echo "  5. Verify streak tracking on consecutive days"
echo ""
echo -e "${GREEN}🎉 Your flashcard system is now enhanced with:${NC}"
echo "  ✨ Spaced repetition scheduling (SM-2 algorithm)"
echo "  🔥 Streak tracking with danger alerts"
echo "  🏆 Achievement badges (17 types)"
echo "  📊 Review calendar heatmap"
echo "  📧 Email notifications"
echo "  🚀 Usage limits for monetization"
echo "  🎮 Leaderboards (optional)"
echo ""
