# Authentication & Access Control System Guide

**CourseAI Platform - Complete Authorization Architecture**

Last Updated: October 8, 2025  
Version: 2.0 (Post-Middleware Fix)

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Request Flow](#request-flow)
4. [Route Configuration](#route-configuration)
5. [Middleware Pipeline](#middleware-pipeline)
6. [Client-Side Gating](#client-side-gating)
7. [Feature Flags](#feature-flags)
8. [User Journey Examples](#user-journey-examples)
9. [Adding New Protected Routes](#adding-new-protected-routes)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 System Overview

The CourseAI platform implements a **multi-layered access control system** that allows:

- **Public Exploration**: Unauthenticated users can browse all creation pages
- **Contextual Authentication**: Auth prompts appear only when performing restricted actions
- **Graceful Degradation**: Users can explore features before deciding to sign up
- **Subscription Gating**: Premium features require appropriate subscription plans

### Core Principles

1. **Browse First, Auth Later**: Let users explore before requiring sign-in
2. **Contextual Prompts**: Show auth/upgrade prompts at the point of action
3. **State Preservation**: Save user input through auth flows
4. **Progressive Disclosure**: Gradually reveal requirements as users engage

---

## 🏗️ Architecture Layers

The system has 4 defense layers:

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: MIDDLEWARE (Server-Side Route Protection)         │
│  - Runs on EVERY request before page loads                  │
│  - Checks: allowPublicAccess, auth status, feature flags    │
│  - Redirects: Unauthorized users from restricted routes     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: LAYOUT GUARDS (Page-Level Protection)             │
│  - Runs when page/layout components mount                   │
│  - Checks: User session, subscription status                │
│  - Redirects: Based on page-specific requirements           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: COMPONENT GATES (UI-Level Protection)             │
│  - PlanAwareButton: Handles navigation with access checks   │
│  - useFeatureAccess: Hook for checking feature availability │
│  - Conditionally renders UI based on user permissions       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: ACTION GATES (Execution-Level Protection)         │
│  - ContextualAuthPrompt: Shows auth modal on action click   │
│  - API Route Protection: Validates on backend               │
│  - Draft System: Preserves state through auth flow          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow

### Scenario 1: Unauthenticated User Clicking "Get Started" on Document Quiz

```
User Action: Click "Get Started" on /dashboard/explore
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 1. CLIENT: PlanAwareButton onClick                           │
│    - allowPublicAccess={true}                                │
│    - Executes: router.push('/dashboard/document')           │
│    - No client-side blocking                                 │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. MIDDLEWARE: Intercepts Request                            │
│    Route: /dashboard/document                                │
│    Step 1: Get token from cookies → null (not authenticated) │
│    Step 2: Check feature flags (environment level) → pass    │
│    Step 3: checkRouteFeatures()                              │
│            - matchRouteToFeature('/dashboard/document')      │
│            - Found: { allowPublicAccess: true, ... }         │
│            - ✅ ALLOW: Public access granted                 │
│    Step 4: checkAuthentication() → SKIPPED (already allowed) │
│    Step 5: checkAdminAccess() → SKIPPED                      │
│    Step 6: checkSubscriptionAccess() → SKIPPED               │
│    Result: NextResponse.next() → ALLOW REQUEST               │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. PAGE: /dashboard/(quiz)/document/page.tsx loads           │
│    - No useFeatureAccess() on mount                          │
│    - No redirect logic                                       │
│    - Renders: File upload form                               │
│    - User sees: Full page with "Generate Quiz" button        │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. USER ACTION: Clicks "Generate Quiz with AI"               │
│    - Form validation passes                                  │
│    - File uploaded successfully                              │
│    - Triggers: handleGenerateQuiz()                          │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. GATE CHECK: useFeatureAccess or manual check              │
│    - Check: session?.user (is user authenticated?)           │
│    - Result: null → NOT AUTHENTICATED                        │
│    - Action: Show ContextualAuthPrompt                       │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. AUTH FLOW: ContextualAuthPrompt Modal                     │
│    - Shows: "Sign in to generate quiz"                       │
│    - Saves: Form data to localStorage/draft system           │
│    - Redirect: /auth/signin?callbackUrl=/dashboard/document  │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 7. POST-AUTH: User returns after signing in                  │
│    - Redirect: Back to /dashboard/document                   │
│    - Draft Recovery: Shows "Restore previous work?" banner   │
│    - User clicks: "Restore" → Form repopulated               │
│    - User clicks: "Generate Quiz" again → SUCCESS            │
└──────────────────────────────────────────────────────────────┘
```

### Scenario 2: Authenticated User with Free Plan Clicking "Generate Quiz"

```
User clicks "Generate Quiz" (already authenticated)
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 1. GATE CHECK: useFeatureAccess('pdf-generation')            │
│    - User authenticated: ✅ YES                              │
│    - User plan: FREE                                         │
│    - Feature requirement: Premium feature                    │
│    - Credits: 0 remaining                                    │
│    - Result: canAccess = false, reason = 'credits_exhausted' │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. UPGRADE PROMPT: ContextualAuthPrompt (upgrade mode)       │
│    - Shows: "Upgrade to generate unlimited quizzes"          │
│    - Saves: Draft to database (user is authenticated)        │
│    - Redirect: /dashboard/subscription?feature=pdf-generation│
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. SUBSCRIPTION PAGE                                         │
│    - Shows: Plan comparison                                  │
│    - User upgrades to Premium                                │
│    - Redirect: Back to /dashboard/document                   │
│    - Draft Recovery: Restores form data                      │
│    - User clicks: "Generate Quiz" → SUCCESS                  │
└──────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Route Configuration

All routes are configured in **`config/feature-routes.ts`**.

### Route Config Structure

```typescript
export const ROUTE_FEATURE_MAP: Record<string, RouteFeatureConfig> = {
  '/dashboard/document': {
    feature: 'pdf-generation',           // Feature identifier
    featureFlag: 'quiz-creation',        // Feature flag to check
    fallbackRoute: '/dashboard/subscription?feature=pdf-generation', // Redirect if blocked
    allowPublicAccess: true              // ⭐ KEY: Allow unauthenticated browsing
  }
}
```

### Route Config Properties

| Property | Type | Description |
|----------|------|-------------|
| `feature` | string | Feature identifier (e.g., 'pdf-generation', 'quiz-mcq') |
| `featureFlag` | string | Feature flag to evaluate (e.g., 'quiz-creation', 'route-protection') |
| `fallbackRoute` | string | Redirect URL if access denied |
| `allowPublicAccess` | boolean | **CRITICAL**: `true` = allow browsing without auth |

### Current Public Routes (allowPublicAccess: true)

```typescript
// Exploration Routes
'/explore'
'/dashboard'
'/dashboard/explore'
'/dashboard/learn'
'/dashboard/course/**'

// Quiz Creation Pages
'/dashboard/mcq'
'/dashboard/openended'
'/dashboard/blanks'
'/dashboard/code'
'/dashboard/flashcard'
'/dashboard/document'

// Course Creation
'/dashboard/create'
'/dashboard/create/course'
```

### Protected Routes (allowPublicAccess: false)

```typescript
// Personal Dashboard
'/home'
'/dashboard/history'
'/dashboard/account'

// Admin
'/admin/**'

// Premium Features
'/dashboard/analytics'
```

---

## 🛡️ Middleware Pipeline

Located in: **`middlewares/core/unified-middleware.ts`**

### Execution Pipeline

```typescript
async execute(req: NextRequest): Promise<MiddlewareResult> {
  // Initialize context
  let context: MiddlewareContext = {
    request: req,
    pathname: req.nextUrl.pathname,
    isAuthenticated: false,
    isAdmin: false
  }

  // 1. Get Token Context (from cookies)
  const tokenResult = await this.getTokenContext(req)
  context = { ...context, ...tokenResult }
  // Updates: isAuthenticated, userId, userPlan, isAdmin

  // 2. Check Route Features (FIXED to respect allowPublicAccess)
  const featureCheck = await this.checkRouteFeatures(context)
  if (featureCheck.response) return featureCheck

  // 3. Check Authentication (requires valid session)
  const authCheck = await this.checkAuthentication(context)
  if (authCheck.response) return authCheck

  // 4. Check Admin Access (requires admin role)
  const adminCheck = await this.checkAdminAccess(context)
  if (adminCheck.response) return adminCheck

  // 5. Check Subscription Access (requires premium plan)
  const subscriptionCheck = await this.checkSubscriptionAccess(context)
  if (subscriptionCheck.response) return subscriptionCheck

  // All checks passed - allow request
  return { response: null, context, shouldContinue: true }
}
```

### Step 2: checkRouteFeatures (CRITICAL FIX APPLIED)

**🔴 BEFORE (Broken):**
```typescript
private async checkRouteFeatures(context: MiddlewareContext) {
  const routeConfig = matchRouteToFeature(context.pathname)
  
  // ❌ PROBLEM: Checked feature flag FIRST, ignored allowPublicAccess
  const featureResult = getFeatureResult(routeConfig.featureFlag, flagContext)
  if (!featureResult.enabled) {
    // Redirected even for public routes!
    return redirect(routeConfig.fallbackRoute)
  }
}
```

**✅ AFTER (Fixed):**
```typescript
private async checkRouteFeatures(context: MiddlewareContext) {
  const routeConfig = matchRouteToFeature(context.pathname)
  
  // ✅ FIX: Check allowPublicAccess FIRST
  if (routeConfig.allowPublicAccess) {
    console.log(`[FeatureCheck] Public access allowed: ${context.pathname}`)
    // Allow browsing - feature flags enforced later on actions
    return { shouldContinue: true }
  }
  
  // Only enforce feature flags for non-public routes
  const featureResult = getFeatureResult(routeConfig.featureFlag, flagContext)
  if (!featureResult.enabled) {
    return redirect(routeConfig.fallbackRoute)
  }
}
```

**Why This Fix Matters:**
- **Before**: Feature flag check happened first → redirected users even with `allowPublicAccess: true`
- **After**: Public access check happens first → users can browse freely, flags enforced only on actions

---

## 🎨 Client-Side Gating

### 1. PlanAwareButton Component

Located in: **`components/quiz/PlanAwareButton.tsx`**

**Purpose**: Smart button that handles navigation with access control.

**Usage in CreateTitleGrid:**
```typescript
<PlanAwareButton
  label="Get Started"
  onClick={() => router.push('/dashboard/document')}
  requiredPlan="FREE"
  allowPublicAccess={true}  // ⭐ Bypass all checks for navigation
  className="..."
/>
```

**Logic Flow:**
```typescript
function PlanAwareButton({
  label,
  onClick,
  requiredPlan = 'FREE',
  allowPublicAccess = false,
  featureType,
  ...props
}) {
  // 1. If allowPublicAccess=true, execute onClick directly
  if (allowPublicAccess) {
    return {
      label: label,
      disabled: false,
      onClick: (e) => {
        if (onClick) onClick(e) // No checks, just execute
      }
    }
  }

  // 2. Otherwise, check access
  const { canAccess, reason } = useFeatureAccess(featureType)
  
  if (!canAccess) {
    // Show upgrade prompt or auth prompt
    return { /* ... */ }
  }

  // 3. User has access
  return { onClick: onClick }
}
```

**When to use `allowPublicAccess={true}`:**
- Navigation buttons (e.g., "Get Started", "Explore", "Browse")
- Links to public exploration pages
- UI elements that don't perform restricted actions

**When to use `allowPublicAccess={false}` (default):**
- Action buttons (e.g., "Create Quiz", "Generate", "Save")
- Export/download buttons
- Submit buttons that trigger backend processing

### 2. ContextualAuthPrompt Component

Located in: **`components/features/auth/ContextualAuthPrompt.tsx`**

**Purpose**: Modal that appears when users try restricted actions without proper access.

**Usage in Forms:**
```typescript
import { ContextualAuthPrompt } from '@/components/features/auth/ContextualAuthPrompt'

function QuizForm() {
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const { status } = useSession()
  
  const handleCreateQuiz = async (formData) => {
    // Check authentication
    if (status !== 'authenticated') {
      setShowAuthPrompt(true)
      return
    }

    // Proceed with quiz creation
    await createQuiz(formData)
  }

  return (
    <>
      <form onSubmit={handleCreateQuiz}>
        {/* form fields */}
        <button type="submit">Create Quiz</button>
      </form>

      {showAuthPrompt && (
        <ContextualAuthPrompt
          isOpen={showAuthPrompt}
          onClose={() => setShowAuthPrompt(false)}
          feature="quiz-mcq"
          message="Sign in to create your quiz"
          ctaText="Continue with Email"
        />
      )}
    </>
  )
}
```

**Features:**
- Automatically saves form data to draft before redirect
- Returns user to same page after authentication
- Shows draft recovery banner on return
- Supports both auth and upgrade flows

### 3. useFeatureAccess Hook

Located in: **`hooks/useFeatureAccess.ts`**

**Purpose**: Client-side hook to check if user can access a feature.

**Usage:**
```typescript
import { useFeatureAccess } from '@/hooks/useFeatureAccess'

function QuizGenerator() {
  const { canAccess, reason, isLoading } = useFeatureAccess('pdf-generation')

  if (isLoading) return <Loader />

  if (!canAccess) {
    return <UpgradePrompt reason={reason} />
  }

  return <QuizGeneratorForm />
}
```

**Returns:**
```typescript
{
  canAccess: boolean,         // Can user access this feature?
  reason: string | null,      // Why not? ('not_authenticated', 'credits_exhausted', etc.)
  isLoading: boolean,         // Still checking?
  requiredPlan: PlanType,     // What plan is needed?
  upgrade: () => void         // Function to trigger upgrade flow
}
```

---

## 🚩 Feature Flags

Located in: **`lib/featureFlags/`**

### Flag Evaluation

```typescript
function getFeatureResult(
  flagKey: string,
  context: FeatureFlagContext
): FeatureResult {
  const flag = FEATURE_FLAGS[flagKey]
  
  // Evaluate all conditions
  const checks = [
    flag.requireAuth && !context.isAuthenticated,
    flag.requirePlan && context.userPlan !== flag.requirePlan,
    flag.requireCredits && !context.hasCredits,
    // ... more checks
  ]

  if (checks.some(check => check)) {
    return {
      enabled: false,
      reason: '...',
      fallbackRoute: '...'
    }
  }

  return { enabled: true }
}
```

### Key Feature Flags

| Flag | Purpose | Requirements |
|------|---------|--------------|
| `route-protection` | Enable/disable route protection | Environment |
| `quiz-creation` | Control quiz creation access | Auth + Credits |
| `course-creation` | Control course creation access | Auth + Plan |
| `admin-panel` | Admin dashboard access | Auth + Admin role |
| `analytics` | Analytics dashboard | Auth + Premium |

---

## 👤 User Journey Examples

### Journey 1: Free Exploration → Sign Up

```
1. User lands on homepage (not authenticated)
   ↓
2. Clicks "Explore" → /dashboard/explore
   ✅ Middleware allows (public route)
   ↓
3. Browses quiz types, reads descriptions
   ✅ Full access to exploration UI
   ↓
4. Clicks "Get Started" on MCQ Quiz → /dashboard/mcq
   ✅ Middleware allows (allowPublicAccess: true)
   ✅ Page loads with form
   ↓
5. Fills out quiz details (topic, count, difficulty)
   ✅ Form state saved locally
   ↓
6. Clicks "Create Quiz with AI"
   ⚠️ ContextualAuthPrompt appears
   ⚠️ "Sign in to create your quiz"
   ↓
7. Clicks "Continue with Email"
   ✅ Draft saved to localStorage
   ✅ Redirect: /auth/signin?callbackUrl=/dashboard/mcq
   ↓
8. Signs in successfully
   ✅ Redirect: Back to /dashboard/mcq
   ✅ Draft Recovery banner appears
   ↓
9. Clicks "Restore previous work"
   ✅ Form repopulated
   ↓
10. Clicks "Create Quiz with AI" again
    ✅ SUCCESS - Quiz generated
```

### Journey 2: Authenticated Free User → Upgrade

```
1. User is signed in (FREE plan, 0 credits)
   ↓
2. Navigates to /dashboard/document
   ✅ Middleware allows (authenticated + public route)
   ↓
3. Uploads PDF file
   ✅ File validation passes
   ↓
4. Clicks "Generate Quiz with AI"
   ⚠️ useFeatureAccess check fails (credits_exhausted)
   ⚠️ ContextualAuthPrompt (upgrade mode) appears
   ↓
5. Clicks "Upgrade to Premium"
   ✅ Draft saved to database (user authenticated)
   ✅ Redirect: /dashboard/subscription?feature=pdf-generation
   ↓
6. Views subscription plans
   ↓
7. Subscribes to Premium plan
   ✅ Stripe checkout → Success
   ✅ Redirect: Back to /dashboard/document
   ✅ Draft Recovery banner appears
   ↓
8. Clicks "Restore"
   ✅ Form repopulated (PDF still there)
   ↓
9. Clicks "Generate Quiz with AI"
   ✅ SUCCESS - Quiz generated (has premium credits)
```

---

## ➕ Adding New Protected Routes

### Step 1: Add Route Config

**File**: `config/feature-routes.ts`

```typescript
export const ROUTE_FEATURE_MAP: Record<string, RouteFeatureConfig> = {
  // ... existing routes

  // New route
  '/dashboard/my-new-feature': {
    feature: 'my-new-feature',              // Feature identifier
    featureFlag: 'my-feature-flag',         // Flag to check
    fallbackRoute: '/dashboard/subscription?feature=my-new-feature',
    allowPublicAccess: true  // ⭐ true = browsing allowed, false = auth required
  }
}
```

### Step 2: Update Navigation Button

**File**: `components/features/explore/CreateTitleGrid.tsx`

```typescript
const tiles = [
  // ... existing tiles
  {
    id: 'my-feature',
    title: 'My New Feature',
    description: 'Create amazing things',
    icon: MyFeatureIcon,
    gradient: 'from-blue-500 to-purple-600',
    url: '/dashboard/my-new-feature',
    requiredPlan: 'FREE',
    featureType: 'my-new-feature' as FeatureType,
    accessRequiredPlan: 'FREE'
  }
]

// In JSX
<PlanAwareButton
  label="Get Started"
  onClick={() => router.push(tile.url)}
  requiredPlan={tile.requiredPlan}
  allowPublicAccess={true}  // ⭐ Allow navigation
  featureType={tile.featureType}
/>
```

### Step 3: Create Page with Gating

**File**: `app/dashboard/my-new-feature/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { ContextualAuthPrompt } from '@/components/features/auth/ContextualAuthPrompt'

export default function MyNewFeaturePage() {
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const { data: session, status } = useSession()
  const [formData, setFormData] = useState({ /* ... */ })

  // ✅ Page loads freely - no auth check on mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // ⚠️ Check auth ONLY when user clicks action button
    if (status !== 'authenticated') {
      setShowAuthPrompt(true)
      return
    }

    // ⚠️ Optional: Check subscription/credits
    const { canAccess, reason } = useFeatureAccess('my-new-feature')
    if (!canAccess) {
      // Handle upgrade flow
      return
    }

    // ✅ User has access - proceed
    await performAction(formData)
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* Form fields - fully accessible */}
        <button type="submit">Create Something</button>
      </form>

      {/* Auth prompt appears ONLY on button click */}
      {showAuthPrompt && (
        <ContextualAuthPrompt
          isOpen={showAuthPrompt}
          onClose={() => setShowAuthPrompt(false)}
          feature="my-new-feature"
          message="Sign in to use this feature"
        />
      )}
    </>
  )
}
```

### Step 4: Add Feature Flag (Optional)

**File**: `lib/featureFlags/flags.ts`

```typescript
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // ... existing flags

  'my-feature-flag': {
    key: 'my-feature-flag',
    name: 'My New Feature',
    enabled: true,
    requireAuth: false,    // false = no auth needed for route access
    requirePlan: null,     // null = no plan requirement
    fallbackRoute: '/dashboard/subscription?feature=my-new-feature'
  }
}
```

---

## 🐛 Troubleshooting

### Issue 1: Users Redirected to Subscription Page When Clicking "Get Started"

**Symptom**: Clicking navigation buttons redirects to subscription page instead of loading the page.

**Root Cause**: Middleware checks feature flags BEFORE checking `allowPublicAccess`.

**Solution**: ✅ FIXED in `middlewares/core/unified-middleware.ts` (line 130-145)

```typescript
// Middleware now checks allowPublicAccess FIRST
if (routeConfig.allowPublicAccess) {
  return { shouldContinue: true } // Allow browsing
}
// Then checks feature flags
```

**Verification**:
```bash
# Check browser console for:
[FeatureCheck] Public access allowed for exploration: /dashboard/document

# Should NOT see:
[UnifiedMiddleware] Feature 'quiz-creation' disabled for route: /dashboard/document
```

### Issue 2: Authenticated Users Still See Auth Prompts

**Symptom**: Signed-in users see "Sign in to continue" when clicking action buttons.

**Possible Causes**:
1. Session not loaded yet (`status === 'loading'`)
2. Session expired but token still in cookies
3. Missing `useSession()` hook in component

**Solution**:
```typescript
const { data: session, status } = useSession()

// Wait for session to load
if (status === 'loading') {
  return <Loader message="Loading session..." />
}

// Then check authentication
if (status !== 'authenticated') {
  setShowAuthPrompt(true)
  return
}
```

### Issue 3: Draft Recovery Not Working

**Symptom**: Form data lost after authentication redirect.

**Possible Causes**:
1. Draft not saved before redirect
2. Draft key mismatch
3. localStorage cleared
4. Draft expiry (>30 days old)

**Solution**:
```typescript
// Ensure draft save before redirect
const saveDraft = async () => {
  const draftKey = `quiz-draft-${featureType}`
  const draftData = {
    formData,
    timestamp: Date.now(),
    returnUrl: window.location.pathname
  }
  
  if (session?.user) {
    // Save to database for authenticated users
    await saveDraftToDatabase(draftData)
  } else {
    // Save to localStorage for guests
    localStorage.setItem(draftKey, JSON.stringify(draftData))
  }
}
```

### Issue 4: Infinite Redirect Loops

**Symptom**: Page keeps redirecting between routes.

**Possible Causes**:
1. Middleware and page both redirecting
2. `callbackUrl` pointing to protected route
3. Feature flag disabled but route marked public

**Solution**:
```typescript
// In middleware - check for redirect loops
const MAX_REDIRECTS = 3
const redirectCount = parseInt(req.cookies.get('redirect_count')?.value || '0')

if (redirectCount > MAX_REDIRECTS) {
  console.error('[Middleware] Redirect loop detected')
  return NextResponse.redirect('/dashboard/explore')
}
```

### Issue 5: Console Errors: "Cannot read property 'allowPublicAccess' of null"

**Symptom**: Middleware crashes when accessing routes not in config.

**Root Cause**: Route not configured in `ROUTE_FEATURE_MAP`.

**Solution**:
```typescript
// Middleware checks for null
const routeConfig = matchRouteToFeature(context.pathname)
if (!routeConfig) {
  // Route not configured - allow by default
  return { shouldContinue: true }
}

// Now safe to access routeConfig.allowPublicAccess
if (routeConfig.allowPublicAccess) {
  // ...
}
```

---

## 📊 System Monitoring

### Key Metrics to Track

```typescript
// Log middleware decisions
console.log('[Middleware]', {
  route: pathname,
  allowed: shouldContinue,
  reason: reason,
  userAuth: isAuthenticated,
  userPlan: userPlan,
  duration: Date.now() - startTime
})

// Track auth prompt appearances
analytics.track('auth_prompt_shown', {
  feature: featureType,
  trigger: 'action_button',
  userStatus: session ? 'authenticated' : 'guest'
})

// Track draft recoveries
analytics.track('draft_recovered', {
  feature: featureType,
  draftAge: Date.now() - draftTimestamp,
  source: session ? 'database' : 'localStorage'
})
```

### Console Logs to Watch

**Successful Public Access:**
```
[FeatureCheck] Public access allowed for exploration: /dashboard/mcq
[Auth] Public access allowed for exploration: /dashboard/mcq
```

**Feature Flag Blocking (for non-public routes):**
```
[UnifiedMiddleware] Feature 'admin-panel' disabled for route: /admin
Redirecting to: /unauthorized?reason=admin
```

**Draft System:**
```
[Draft] Saved draft for feature: quiz-mcq
[Draft] Recovered draft (age: 2 minutes)
[Draft] Cleaned up 3 expired drafts (>30 days)
```

---

## 🎓 Best Practices

### DO ✅

1. **Always use `allowPublicAccess: true` for exploration routes**
   ```typescript
   '/dashboard/my-feature': {
     allowPublicAccess: true  // Let users browse
   }
   ```

2. **Gate actions, not pages**
   ```typescript
   // ✅ GOOD: Check on button click
   const handleCreate = () => {
     if (!session) {
       showAuthPrompt()
       return
     }
     // proceed
   }
   
   // ❌ BAD: Check on page mount
   useEffect(() => {
     if (!session) {
       router.push('/auth/signin')
     }
   }, [])
   ```

3. **Use ContextualAuthPrompt for all auth flows**
   ```typescript
   <ContextualAuthPrompt
     feature="quiz-mcq"
     message="Sign in to create quiz"
   />
   ```

4. **Save drafts before redirects**
   ```typescript
   const handleAuth = async () => {
     await saveDraft(formData)
     router.push('/auth/signin')
   }
   ```

5. **Add loading states**
   ```typescript
   if (status === 'loading') {
     return <Loader message="Checking access..." />
   }
   ```

### DON'T ❌

1. **Don't block page loads with auth checks**
   ```typescript
   // ❌ BAD
   if (!session) {
     redirect('/auth/signin')
   }
   return <MyPage />
   ```

2. **Don't duplicate middleware logic in components**
   ```typescript
   // ❌ BAD - Middleware already handles this
   useEffect(() => {
     if (!canAccessRoute(pathname)) {
       router.push('/unauthorized')
     }
   }, [])
   ```

3. **Don't use `allowPublicAccess` for action buttons**
   ```typescript
   // ❌ BAD - Action should check access
   <PlanAwareButton
     label="Create Quiz"
     allowPublicAccess={true}
     onClick={createQuiz}
   />
   
   // ✅ GOOD
   <PlanAwareButton
     label="Create Quiz"
     allowPublicAccess={false}  // Will check access
     onClick={createQuiz}
   />
   ```

4. **Don't redirect without saving user work**
   ```typescript
   // ❌ BAD
   router.push('/auth/signin')
   
   // ✅ GOOD
   await saveDraft(formData)
   router.push('/auth/signin?callbackUrl=' + currentUrl)
   ```

---

## 🔐 Security Considerations

### Client-Side vs Server-Side

**Client-side checks are for UX only** - always validate on the server:

```typescript
// Client (UX)
if (!session) {
  showAuthPrompt()  // Just UI feedback
  return
}

// Server (Security)
export async function POST(req: Request) {
  const session = await getServerSession()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Proceed with action
}
```

### API Route Protection

```typescript
// app/api/quiz/create/route.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(req: Request) {
  // 1. Check authentication
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Check subscription/credits
  const user = await getUserWithSubscription(session.user.id)
  if (!user.hasCredits) {
    return Response.json(
      { error: 'No credits remaining', upgradeUrl: '/dashboard/subscription' },
      { status: 403 }
    )
  }

  // 3. Proceed with action
  const quiz = await createQuiz(req.body, session.user.id)
  return Response.json({ quiz })
}
```

---

## 📚 Related Documentation

- [Feature Flags System](./FEATURE_FLAGS.md)
- [Draft Management System](./DRAFT_SYSTEM.md)
- [Subscription & Billing](./SUBSCRIPTION_GUIDE.md)
- [Middleware Architecture](./MIDDLEWARE_ARCHITECTURE.md)

---

## 🆘 Getting Help

### Debug Checklist

When troubleshooting access control issues:

1. ✅ Check browser console for middleware logs
2. ✅ Verify route config in `feature-routes.ts`
3. ✅ Check `allowPublicAccess` prop on buttons
4. ✅ Inspect session status with `useSession()`
5. ✅ Check feature flag state in dev tools
6. ✅ Verify API route protection
7. ✅ Check for infinite redirect loops
8. ✅ Confirm draft save/restore working

### Common Log Messages

| Message | Meaning | Action |
|---------|---------|--------|
| `Public access allowed` | Route is browsable | ✅ Expected |
| `Feature disabled for route` | Feature flag blocking | Check flag config |
| `Authentication required` | User not signed in | Show auth prompt |
| `Redirecting to fallback` | Access denied | Check user plan/credits |

---

**Last Updated**: October 8, 2025  
**Maintained By**: CourseAI Platform Team  
**Version**: 2.0 (Post-Middleware Fix)
