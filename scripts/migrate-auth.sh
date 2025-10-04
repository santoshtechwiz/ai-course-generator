#!/bin/bash

# Migration Helper Script
# Helps identify files that can be migrated to the new unified useAuth hook

echo "🔍 Finding files using both useAuth and useUnifiedSubscription..."
echo ""

# Find files importing both hooks
echo "Files with BOTH imports (ready to migrate):"
grep -rl "import.*useAuth.*from.*@/modules/auth" . \
  --include="*.tsx" \
  --include="*.ts" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=dist | \
  xargs grep -l "useUnifiedSubscription" 2>/dev/null | \
  grep -v "AUTH_SUBSCRIPTION_REFACTOR.md" | \
  sort

echo ""
echo "---"
echo ""

# Count total occurrences
TOTAL=$(grep -r "useUnifiedSubscription" . \
  --include="*.tsx" \
  --include="*.ts" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=dist \
  --exclude="useUnifiedSubscription.ts" \
  --exclude="SubscriptionProvider.tsx" \
  --exclude="AUTH_SUBSCRIPTION_REFACTOR.md" | \
  wc -l)

echo "📊 Total useUnifiedSubscription usages: $TOTAL"
echo ""

echo "💡 Migration Steps:"
echo "1. For each file listed above:"
echo "   - Remove: import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription'"
echo "   - Keep: import { useAuth } from '@/modules/auth'"
echo "   - Replace: const { subscription, plan, ... } = useUnifiedSubscription()"
echo "   - With: const { plan, credits, hasCredits, ... } = useAuth()"
echo ""
echo "2. Update property access:"
echo "   - subscription.plan → plan"
echo "   - subscription.credits → credits"
echo "   - subscription.hasCredits → hasCredits"
echo ""
echo "3. Test thoroughly after migration!"
echo ""

# Optionally show preview of one file
echo "📄 Example file to migrate:"
grep -rl "import.*useAuth.*from.*@/modules/auth" . \
  --include="*.tsx" \
  --include="*.ts" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=dist | \
  xargs grep -l "useUnifiedSubscription" 2>/dev/null | \
  grep -v "AUTH_SUBSCRIPTION_REFACTOR.md" | \
  head -1
