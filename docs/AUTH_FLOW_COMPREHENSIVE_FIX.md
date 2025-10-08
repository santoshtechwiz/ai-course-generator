# Authentication Flow Comprehensive Fix Plan

**Goal**: Make the authentication, subscription, and credit-handling flows frictionless, consistent, and user-trust-friendly.

**Status**: ✅ Infrastructure Complete | ⏳ Implementation in Progress

---

## 📊 What's Already Built (from git changes)

### ✅ Phase 1: Infrastructure (COMPLETE)

1. **Middleware Fix Applied** ✅
   - File: `middlewares/core/unified-middleware.ts`
   - Fix: `allowPublicAccess` check now happens BEFORE feature flag enforcement
   - Result: Users can browse creation pages without premature redirects

2. **Comprehensive Auth Components** ✅
   - `components/auth/ContextualAuthPrompt.tsx` - Auth modal with context
   - `components/auth/BreadcrumbWelcome.tsx` - Welcome-back message
   - `hooks/useContextualAuth.ts` - Auth checking hook
   
3. **Upgrade Flow Components** ✅
   - `components/shared/ContextualUpgradePrompt.tsx` - Upgrade modal
   - `components/shared/UpgradeDialog.tsx` - Plan comparison
   - `hooks/useContextualUpgrade.ts` - Smart upgrade triggers
   
4. **Draft Management System** ✅
   - `hooks/useDraftManagement.ts` - Auto-save + recovery
   - `components/shared/DraftRecoveryBanner.tsx` - Draft restoration UI
   
5. **Session Context Tracking** ✅
   - `hooks/useSessionContext.ts` - Intent preservation, engagement tracking
   - Stores intended actions through auth flow
   - Prevents upgrade prompt spam
   
6. **Credit Management** ✅
   - `components/shared/CreditCounter.tsx` - Visual credit display
   - Contextual warnings at 80%, 90%, 100% usage
   - Integrated with session context

7. **Centralized Feature Access** ✅
   - `lib/featureAccess.ts` - Unified feature checking
   - `lib/planHierarchy.ts` - Plan comparisons
   - `hooks/useRouteProtection.ts` - Client-side fallback
   
8. **Feature Flags System** ✅
   - `lib/featureFlags/` - Complete flag management
   - Environment-based overrides
   - Rollout percentage support
   
9. **Documentation** ✅
   - `docs/AUTH_AND_ACCESS_CONTROL_GUIDE.md` - Complete system guide
   - Flowcharts, examples, troubleshooting
   
10. **API Protection** ✅
    - `app/api/subscriptions/validate/route.ts` - Server-side validation

---

## 🎯 Phase 2: Implementation Tasks

### Task 1: Fix Redirect After Sign-In (CRITICAL)

**Problem**: Users redirected to `/home` instead of intended destination

**Root Cause**: callbackUrl not properly preserved or defaulting to `/home`

**Files to Check**:
```typescript
// 1. Auth configuration
app/api/auth/[...nextauth]/route.ts
- Check callbacks.redirect function
- Ensure callbackUrl is respected
- Default should be previous page, not /home

// 2. Sign-in forms
app/auth/signin/page.tsx (if exists)
components/auth/sign-in-form.tsx (if exists)
- Ensure callbackUrl passed to signIn()

// 3. Middleware redirect
middlewares/core/unified-middleware.ts
- Verify callbackUrl is preserved in redirects
```

**Fix Required**:
```typescript
// In auth callback configuration
callbacks: {
  async redirect({ url, baseUrl }) {
    // If url has callbackUrl param, use it
    const urlObj = new URL(url, baseUrl)
    const callbackUrl = urlObj.searchParams.get('callbackUrl')
    
    if (callbackUrl) {
      // Sanitize and validate
      if (callbackUrl.startsWith('/')) {
        return `${baseUrl}${callbackUrl}`
      }
    }
    
    // If url is relative, use it
    if (url.startsWith('/')) return `${baseUrl}${url}`
    
    // If url is absolute and same origin, use it
    if (new URL(url).origin === baseUrl) return url
    
    // Default to intended action or dashboard, NOT /home
    return `${baseUrl}/dashboard/explore`
  }
}

// In ContextualAuthPrompt
const handleSignIn = async (provider: 'github' | 'google') => {
  // Store intended action
  setIntendedAction({
    type: actionType,
    context: { actionContext },
    timestamp: Date.now(),
    returnUrl: pathname, // Current page
    description: getActionDescription()
  })
  
  // Sign in with proper callback
  await signIn(provider, {
    callbackUrl: pathname // Return to current page
  })
}
```

---

### Task 2: Consistent Upgrade Messaging Across All Pages

**Problem**: Inconsistent or duplicate "Upgrade to create quiz" banners

**Solution**: Centralized upgrade trigger with smart display logic

**Implementation**:

```typescript
// 1. Create unified upgrade trigger component
// components/shared/UnifiedUpgradeTrigger.tsx

"use client"

import { useEffect } from 'react'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { useContextualUpgrade } from '@/hooks/useContextualUpgrade'
import { ContextualUpgradePrompt } from '@/components/shared/ContextualUpgradePrompt'

interface UnifiedUpgradeTriggerProps {
  feature: FeatureType
  trigger?: 'discovery' | 'action'
  customMessage?: string
}

export function UnifiedUpgradeTrigger({ 
  feature, 
  trigger = 'discovery',
  customMessage 
}: UnifiedUpgradeTriggerProps) {
  const { canAccess, reason, requiredPlan } = useFeatureAccess(feature)
  const { 
    promptState, 
    closePrompt, 
    triggerDiscoveryUpgrade 
  } = useContextualUpgrade()

  // Auto-show on discovery if exploring and doesn't have access
  useEffect(() => {
    if (trigger === 'discovery' && !canAccess && reason === 'subscription') {
      triggerDiscoveryUpgrade(feature, requiredPlan)
    }
  }, [trigger, canAccess, reason, feature, requiredPlan, triggerDiscoveryUpgrade])

  return (
    <ContextualUpgradePrompt
      open={promptState.open}
      onOpenChange={closePrompt}
      requiredPlan={promptState.requiredPlan}
      context={promptState.context}
    />
  )
}

// 2. Usage in pages - REMOVE old upgrade cards, use this
// app/dashboard/(quiz)/openended/page.tsx

export default function OpenEndedPage() {
  return (
    <>
      {/* Form content */}
      <OpenEndedQuizForm />
      
      {/* Unified upgrade trigger - handles all messaging */}
      <UnifiedUpgradeTrigger 
        feature="quiz-openended" 
        trigger="discovery"
      />
    </>
  )
}
```

**Pages to Update**:
- ✅ `/dashboard/mcq` - Already uses contextual auth
- ⏳ `/dashboard/openended` - Remove upgrade card, add UnifiedUpgradeTrigger
- ⏳ `/dashboard/blanks` - Remove upgrade card, add UnifiedUpgradeTrigger
- ✅ `/dashboard/code` - Already uses contextual auth
- ⏳ `/dashboard/flashcard` - Check + add UnifiedUpgradeTrigger
- ⏳ `/dashboard/document` - Add ContextualAuthPrompt to Generate button
- ⏳ `/dashboard/create/course` - Check + add UnifiedUpgradeTrigger

---

### Task 3: Contextual Notifications for Zero Credits

**Problem**: Users with 0 credits see blocking messages

**Solution**: Non-blocking guidance with clear upgrade path

**Implementation**:

```typescript
// 1. Update CreditCounter to show gentle guidance
// components/shared/CreditCounter.tsx (already created, enhance)

// Add banner variant
export function CreditGuidanceBanner() {
  const { remainingCredits, plan } = useUnifiedSubscription()
  const { triggerCreditExhaustionUpgrade } = useContextualUpgrade()
  const [dismissed, setDismissed] = useState(false)

  if (remainingCredits > 0 || dismissed || plan === 'PREMIUM') {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 mb-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100">
            You've used all your monthly credits
          </h4>
          <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
            Upgrade to Premium for unlimited quiz and course creation. Your current work is saved!
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={() => triggerCreditExhaustionUpgrade()}
              className="bg-amber-500 hover:bg-amber-600"
            >
              View Plans
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// 2. Add to dashboard layout (non-blocking)
// app/dashboard/layout.tsx

export default function DashboardLayout({ children }) {
  return (
    <>
      <CreditGuidanceBanner />
      <CreditCounter />
      {children}
    </>
  )
}
```

---

### Task 4: Post-Auth Welcome Message

**Status**: ✅ Already Implemented (`components/auth/BreadcrumbWelcome.tsx`)

**Integration Required**:

```typescript
// app/dashboard/layout.tsx or app/layout.tsx

import { BreadcrumbWelcome } from '@/components/auth/BreadcrumbWelcome'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <BreadcrumbWelcome /> {/* Shows "Welcome back! Let's continue..." */}
        {children}
      </body>
    </html>
  )
}
```

---

### Task 5: Maintain Non-Blocking Exploration

**Status**: ✅ Middleware Fix Applied

**Verification Needed**:
- Test each route from `/dashboard/explore`
- Ensure all "Get Started" buttons navigate without redirect
- Verify auth prompts only appear on action buttons

---

### Task 6: Centralize Feature Access Checks

**Status**: ✅ Infrastructure Complete

**Implementation Pattern**:

```typescript
// GOOD: Centralized pattern
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { useContextualAuth } from '@/components/auth'
import { useContextualUpgrade } from '@/hooks/useContextualUpgrade'

function QuizForm() {
  const { requireAuth, authPrompt, closeAuthPrompt } = useContextualAuth()
  const { promptState, closePrompt, triggerDiscoveryUpgrade } = useContextualUpgrade()
  const { canAccess, reason, requiredPlan } = useFeatureAccess('quiz-mcq')

  const handleSubmit = async (data) => {
    // 1. Check auth
    if (!requireAuth('create_quiz', data.title)) {
      return // Auth prompt shown
    }

    // 2. Check feature access
    if (!canAccess) {
      if (reason === 'subscription') {
        triggerDiscoveryUpgrade('MCQ Quizzes', requiredPlan)
        return
      }
      if (reason === 'credits') {
        triggerCreditExhaustionUpgrade()
        return
      }
    }

    // 3. Proceed
    await createQuiz(data)
  }

  return (
    <>
      <form onSubmit={handleSubmit}>...</form>
      <ContextualAuthPrompt {...authPrompt} onOpenChange={closeAuthPrompt} />
      <ContextualUpgradePrompt {...promptState} onOpenChange={closePrompt} />
    </>
  )
}
```

---

### Task 7: Preserve User State Through Transitions

**Status**: ✅ Draft System Implemented

**Integration Required**:

```typescript
// 1. Add auto-save to forms
import { useDraftManagement, useAutoSave } from '@/hooks/useDraftManagement'

function QuizForm() {
  const [formData, setFormData] = useState({ /* ... */ })
  const { saveDraft } = useDraftManagement()

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft({
        type: 'quiz',
        title: formData.title || 'Untitled Quiz',
        data: formData,
        autoSaved: true
      })
    }, 30000)

    return () => clearInterval(interval)
  }, [formData, saveDraft])

  // Save before auth redirect
  const handleAuthRequired = () => {
    saveDraft({
      type: 'quiz',
      title: formData.title || 'Untitled Quiz',
      data: formData,
      autoSaved: false
    })
    setShowAuthPrompt(true)
  }
}

// 2. Add recovery banner
import { DraftRecoveryBanner } from '@/components/shared/DraftRecoveryBanner'

function QuizFormPage() {
  const [formData, setFormData] = useState({})

  const handleRestore = (draft: Draft) => {
    setFormData(draft.data)
    toast.success('Draft restored!')
  }

  return (
    <>
      <DraftRecoveryBanner type="quiz" onRestore={handleRestore} />
      <QuizForm initialData={formData} />
    </>
  )
}
```

---

## 📋 Implementation Checklist

### CRITICAL (Do First)
- [ ] **Task 1**: Fix auth redirect to preserve callbackUrl
  - [ ] Check `app/api/auth/[...nextauth]/route.ts` callbacks
  - [ ] Test sign-in flow returns to intended page
  - [ ] Verify intended action is preserved

- [ ] **Task 2**: Remove inconsistent upgrade cards
  - [ ] `/dashboard/openended` - Remove inline upgrade card
  - [ ] `/dashboard/blanks` - Remove inline upgrade card
  - [ ] `/dashboard/flashcard` - Check for upgrade blocks
  - [ ] Replace all with `UnifiedUpgradeTrigger`

- [ ] **Task 3**: Add contextual credit guidance
  - [ ] Create `CreditGuidanceBanner` component
  - [ ] Add to dashboard layout (non-blocking)
  - [ ] Test with 0-credit account

### HIGH PRIORITY
- [ ] **Task 4**: Integrate welcome message
  - [ ] Add `BreadcrumbWelcome` to root layout
  - [ ] Test post-auth display
  - [ ] Verify auto-dismiss after 5s

- [ ] **Task 7**: Add draft management to forms
  - [ ] Document page - Add auto-save
  - [ ] OpenEnded page - Add auto-save
  - [ ] Blanks page - Add auto-save
  - [ ] Add `DraftRecoveryBanner` to all forms

### MEDIUM PRIORITY
- [ ] **Task 5**: Verification testing
  - [ ] Test all routes from Explore page
  - [ ] Verify no premature redirects
  - [ ] Confirm auth prompts only on actions

- [ ] **Task 6**: Code cleanup
  - [ ] Remove old FeatureGate components
  - [ ] Remove inline subscription checks
  - [ ] Consolidate to unified pattern

---

## 🧪 Testing Plan

### Test 1: Intent Preservation
```
1. Open incognito: http://localhost:37784/dashboard/explore
2. Click "Get Started" on MCQ Quiz
3. Fill form with "Test Quiz" title
4. Click "Create Quiz"
5. Auth prompt appears
6. Sign in
7. ✅ VERIFY: Redirected to /dashboard/mcq (NOT /home)
8. ✅ VERIFY: Draft recovery banner appears
9. Click "Restore"
10. ✅ VERIFY: Form has "Test Quiz" title
```

### Test 2: Consistent Messaging
```
1. Sign in as FREE user with 0 credits
2. Navigate to each creation page:
   - /dashboard/mcq
   - /dashboard/openended
   - /dashboard/blanks
   - /dashboard/code
   - /dashboard/document
   - /dashboard/flashcard
   - /dashboard/create/course
3. ✅ VERIFY: Only ONE upgrade trigger per page
4. ✅ VERIFY: Messaging is consistent
5. ✅ VERIFY: No duplicate prompts
```

### Test 3: Non-Blocking Navigation
```
1. Open incognito browser
2. Visit /dashboard/explore
3. Click each "Get Started" button
4. ✅ VERIFY: All pages load without auth redirect
5. ✅ VERIFY: Forms are fully accessible
6. ✅ VERIFY: Auth prompt only on submit button
```

### Test 4: Credit Guidance
```
1. Sign in as FREE user with 0 credits
2. Navigate to /dashboard
3. ✅ VERIFY: CreditGuidanceBanner appears
4. ✅ VERIFY: Banner is informative, not blocking
5. Click "View Plans"
6. ✅ VERIFY: Redirected to subscription page
7. Go back
8. Click "Dismiss"
9. ✅ VERIFY: Banner disappears
```

### Test 5: Welcome Message
```
1. Open incognito
2. Click "Get Started" on any feature
3. Sign in
4. ✅ VERIFY: Welcome message appears at top
5. ✅ VERIFY: Message includes intended action context
6. Wait 5 seconds
7. ✅ VERIFY: Message auto-dismisses
```

### Test 6: Draft Recovery
```
1. Open incognito
2. Navigate to /dashboard/mcq
3. Fill form: Title="My Draft Quiz", Questions=10
4. Wait 30 seconds (auto-save)
5. Click "Create Quiz"
6. Sign in
7. ✅ VERIFY: Returned to /dashboard/mcq
8. ✅ VERIFY: Draft recovery banner appears
9. Click "Restore"
10. ✅ VERIFY: Form has saved data
```

---

## 📊 Success Metrics

After implementation, verify:

1. ✅ **Intent Preservation**: 100% of users return to intended page after auth
2. ✅ **Consistent Messaging**: Zero duplicate upgrade prompts
3. ✅ **Non-Blocking**: All exploration pages load without auth
4. ✅ **Credit Guidance**: Clear, helpful messaging for 0-credit users
5. ✅ **Welcome Experience**: 95%+ users see welcome message
6. ✅ **Draft Recovery**: Zero data loss through auth flows

---

## 🚀 Timeline

| Phase | Tasks | Time | Status |
|-------|-------|------|--------|
| **Phase 1** | Infrastructure setup | 8 hours | ✅ COMPLETE |
| **Phase 2 (Current)** | Implementation | 6-8 hours | ⏳ IN PROGRESS |
| **Phase 3** | Testing | 2-3 hours | ⏳ PENDING |
| **Phase 4** | Polish | 1-2 hours | ⏳ PENDING |
| **TOTAL** | | **17-21 hours** | **~50% Complete** |

---

## 📁 Files to Modify (Phase 2)

### Critical Files
1. `app/api/auth/[...nextauth]/route.ts` - Fix redirect callback
2. `app/dashboard/(quiz)/openended/page.tsx` - Remove upgrade card
3. `app/dashboard/(quiz)/blanks/page.tsx` - Remove upgrade card
4. `app/dashboard/(quiz)/document/page.tsx` - Add contextual auth
5. `components/shared/CreditGuidanceBanner.tsx` - Create component
6. `app/dashboard/layout.tsx` - Add welcome + credit banner

### Secondary Files
7. `app/dashboard/(quiz)/flashcard/page.tsx` - Check + update
8. `app/dashboard/create/course/page.tsx` - Check + update
9. All form components - Add auto-save + draft recovery

---

## 🎯 Next Actions

1. **IMMEDIATE**: Review auth callback configuration
2. **TODAY**: Remove inconsistent upgrade cards
3. **THIS WEEK**: Add draft management to all forms
4. **TESTING**: Run complete test suite

---

**Last Updated**: October 8, 2025  
**Status**: Infrastructure Complete, Implementation 50% Done  
**Priority**: Fix auth redirect first, then upgrade messaging consistency
