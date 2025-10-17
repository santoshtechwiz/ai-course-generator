#!/bin/bash
# Final verification script - checks all components are in place

echo "🔍 Flashcard Enhancement System - Verification"
echo "=============================================="
echo ""

ERRORS=0
WARNINGS=0

# Check services
echo "📦 Checking Services..."
for service in flashcard-scheduler.service.ts streak.service.ts badge.service.ts email.service.ts usage-limit.service.ts; do
  if [ -f "services/$service" ]; then
    echo "  ✅ $service"
  else
    echo "  ❌ $service MISSING"
    ((ERRORS++))
  fi
done

# Check API routes
echo ""
echo "🌐 Checking API Routes..."
for route in flashcards/review flashcards/due flashcards/streak flashcards/stats badges usage/stats; do
  if [ -f "app/api/$route/route.ts" ]; then
    echo "  ✅ /api/$route"
  else
    echo "  ❌ /api/$route MISSING"
    ((ERRORS++))
  fi
done

# Check UI components
echo ""
echo "🎨 Checking UI Components..."
for component in StreakBanner.tsx ReviewStats.tsx BadgeShowcase.tsx ReviewCalendar.tsx UpgradePrompt.tsx; do
  if [ -f "components/flashcard/$component" ]; then
    echo "  ✅ $component"
  else
    echo "  ❌ $component MISSING"
    ((ERRORS++))
  fi
done

# Check migration files
echo ""
echo "💾 Checking Migration Files..."
if [ -f "prisma/migrations/20251016_add_flashcard_streaks_and_sm2/migration.sql" ]; then
  echo "  ✅ Phase 1 migration SQL"
else
  echo "  ❌ Phase 1 migration MISSING"
  ((ERRORS++))
fi

if [ -f "scripts/migrate-phase2-phase3.ts" ]; then
  echo "  ✅ Phase 2/3 migration script"
else
  echo "  ❌ Phase 2/3 migration MISSING"
  ((ERRORS++))
fi

if [ -f "scripts/run-all-migrations.sh" ]; then
  echo "  ✅ Master migration script"
else
  echo "  ❌ Master migration MISSING"
  ((ERRORS++))
fi

# Check documentation
echo ""
echo "📚 Checking Documentation..."
if [ -f "docs/FLASHCARD_SYSTEM_COMPLETE.md" ]; then
  echo "  ✅ Complete documentation"
else
  echo "  ⚠️  Documentation not found"
  ((WARNINGS++))
fi

# Check Prisma schema
echo ""
echo "🗄️  Checking Prisma Schema..."
if grep -q "streak.*Int.*@default(0)" prisma/schema.prisma; then
  echo "  ✅ User.streak field"
else
  echo "  ❌ User.streak field MISSING"
  ((ERRORS++))
fi

if grep -q "easeFactor.*Decimal.*@default(2.5)" prisma/schema.prisma; then
  echo "  ✅ FlashCardReview.easeFactor field"
else
  echo "  ❌ FlashCardReview.easeFactor field MISSING"
  ((ERRORS++))
fi

# Summary
echo ""
echo "=============================================="
if [ $ERRORS -eq 0 ]; then
  echo "✅ ALL CHECKS PASSED!"
  echo ""
  echo "🚀 Next Steps:"
  echo "  1. Run: bash scripts/run-all-migrations.sh"
  echo "  2. Restart dev server: npm run dev"
  echo "  3. Visit: http://localhost:3000/dashboard/flashcard/review"
  echo "  4. Test rating flashcards"
  echo "  5. Check badge unlocks"
  exit 0
else
  echo "❌ ERRORS FOUND: $ERRORS"
  echo "⚠️  WARNINGS: $WARNINGS"
  echo ""
  echo "Please fix errors before proceeding with migration."
  exit 1
fi
