#!/bin/bash
# Quick fix script to add missing resetFrequency column

echo "🔧 Adding missing resetFrequency column to UsageLimit table..."

# Use npx prisma db execute for database commands
npx prisma db execute --file scripts/fix-usage-limit-column.sql --schema prisma/schema.prisma

if [ $? -eq 0 ]; then
  echo "✅ Column added successfully!"
  echo ""
  echo "🔄 Regenerating Prisma client..."
  npx prisma generate
  
  echo ""
  echo "✅ Database fixed! Restart your dev server:"
  echo "   npm run dev"
else
  echo "❌ Failed to add column. Try running manually:"
  echo "   npx prisma db execute --file scripts/fix-usage-limit-column.sql"
fi
