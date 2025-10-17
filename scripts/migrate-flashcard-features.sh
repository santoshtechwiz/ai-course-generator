#!/bin/bash
# Run Prisma migration for flashcard streak and SM-2 features

echo "📦 Running database migration..."
npx prisma migrate dev --name add_flashcard_streaks_and_sm2

echo "🔄 Regenerating Prisma Client..."
npx prisma generate

echo "✅ Migration complete! Phase 1 backend infrastructure is ready."
echo ""
echo "Next steps:"
echo "1. Test flashcard rating persistence"
echo "2. Check streak tracking on consecutive days"
echo "3. Visit /dashboard/flashcard/review to see due cards"
echo "4. Verify SM-2 scheduling intervals (1d → 6d → exponential)"
