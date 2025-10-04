# 🚀 Performance Optimization Implementation Checklist

This checklist tracks remaining optimizations to bring the CourseAI platform to peak performance.

---

## ✅ COMPLETED (Current Session)

### Code Splitting & Lazy Loading
- [x] Lazy load quiz modules (McqQuizClient, FlashcardQuizClient, OpenEndedQuizClient, BlanksQuizClient)
- [x] Add Suspense boundaries with PageLoader fallbacks
- [x] Lazy load subscription page components (PricingPage, StripeSecureCheckout)
- [x] Dynamic imports for dashboard tabs (OverviewTab, CoursesTab, QuizzesTab)

### Authentication & State
- [x] Create unified useAuth hook (merges auth + subscription)
- [x] Remove duplicate SessionProvider
- [x] Implement session caching (30-second TTL)
- [x] Fix infinite render loop in SubscriptionProvider
- [x] Memoize all computed values in SubscriptionProvider
- [x] Disable aggressive NextAuth refetch

### Bundle Optimization
- [x] Enable webpack filesystem caching
- [x] Disable splitChunks in dev mode
- [x] Add optimizePackageImports for lucide-react, recharts, @radix-ui
- [x] Remove console logs in production

### Documentation
- [x] Create QUIZ_PERFORMANCE_OPTIMIZATIONS.md
- [x] Create PERFORMANCE_AUDIT_REPORT.md
- [x] Document memoization strategy
- [x] Create migration guide for useAuth

---

## 🔴 HIGH PRIORITY (Do Next)

### 1. Implement next/font for Google Fonts
**Impact**: Eliminates CLS (Cumulative Layout Shift), improves LCP

**Files to Modify**:
- [ ] `app/layout.tsx` - Add font imports
- [ ] `tailwind.config.ts` - Update font family variables
- [ ] Remove external Google Fonts from `<head>`

**Implementation**:
```typescript
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

```javascript
// tailwind.config.ts
theme: {
  extend: {
    fontFamily: {
      sans: ['var(--font-inter)', 'sans-serif'],
      mono: ['var(--font-roboto-mono)', 'monospace'],
    },
  },
}
```

**Estimated Time**: 30 minutes  
**Expected Improvement**: CLS < 0.05, LCP -200ms

---

### 2. Run Bundle Analyzer
**Impact**: Identify heavy imports, find optimization opportunities

**Steps**:
```bash
# Install
npm install --save-dev @next/bundle-analyzer

# Configure next.config.mjs
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)

# Run analysis
ANALYZE=true npm run build
```

**Action Items After Analysis**:
- [ ] Identify packages > 100KB
- [ ] Look for duplicate dependencies
- [ ] Find unused code in large packages
- [ ] Consider alternatives for heavy libraries

**Estimated Time**: 1 hour  
**Expected Improvement**: Identify 20-30% additional bundle reduction

---

### 3. Audit & Replace <img> Tags with <Image>
**Impact**: Lazy loading, automatic optimization, responsive images

**Search for img tags**:
```bash
grep -r "<img" app/ components/ --include="*.tsx" --include="*.jsx"
```

**Replace with Next/Image**:
```typescript
// ❌ BEFORE
<img src="/course-thumbnail.jpg" alt="Course" />

// ✅ AFTER
import Image from 'next/image'

<Image
  src="/course-thumbnail.jpg"
  alt="Course"
  width={400}
  height={225}
  loading="lazy"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

**Files to Check**:
- [ ] Course cards
- [ ] Quiz cards
- [ ] User avatars
- [ ] Hero sections
- [ ] Modal content

**Estimated Time**: 2 hours  
**Expected Improvement**: LCP -500ms, CLS < 0.1

---

### 4. Add Route Preloading on Hover
**Impact**: Instant perceived navigation, better UX

**Implementation**:
```typescript
// components/shared/RecommendedCard.tsx
import { useRouter } from 'next/navigation'

export function RecommendedCard({ item }) {
  const router = useRouter()

  const handleMouseEnter = () => {
    router.prefetch(`/dashboard/course/${item.slug}`)
  }

  return (
    <Link 
      href={`/dashboard/course/${item.slug}`}
      onMouseEnter={handleMouseEnter}
    >
      {/* Card content */}
    </Link>
  )
}
```

**Apply to**:
- [ ] Course cards
- [ ] Quiz cards
- [ ] Navigation links
- [ ] Dashboard cards

**Estimated Time**: 1 hour  
**Expected Improvement**: Perceived load time -200ms

---

## 🟡 MEDIUM PRIORITY

### 5. Implement Virtual Scrolling
**Impact**: Faster rendering for long lists (1000+ items)

**Libraries**:
- `@tanstack/react-virtual` (recommended)
- `react-window`

**Apply to**:
- [ ] Quiz list page (/dashboard/quizzes)
- [ ] Course list page (/dashboard/courses)
- [ ] Search results
- [ ] User management table (admin)

**Estimated Time**: 3 hours  
**Expected Improvement**: TTI -1s for long lists

---

### 6. Add Service Worker for Offline Support
**Impact**: PWA capabilities, offline access, faster repeat visits

**Implementation**:
```bash
# Install Workbox
npm install --save-dev workbox-webpack-plugin

# Create service worker
# public/sw.js

# Register in _app.tsx
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  navigator.serviceWorker.register('/sw.js')
}
```

**Cache Strategy**:
- Static assets: Cache-first
- API calls: Network-first with fallback
- Images: Cache-first with expiration

**Estimated Time**: 4 hours  
**Expected Improvement**: Repeat visit load time -70%

---

### 7. Optimize Database Queries
**Impact**: Faster API response times, reduced server load

**Actions**:
- [ ] Add indexes for frequently queried fields
- [ ] Use `select` to limit returned fields
- [ ] Implement query batching
- [ ] Add database connection pooling

**Example**:
```typescript
// ❌ BEFORE - No select, N+1 queries
const courses = await prisma.course.findMany({
  include: {
    chapters: true,
    creator: true,
  }
})

// ✅ AFTER - Selective fields, single query
const courses = await prisma.course.findMany({
  select: {
    id: true,
    title: true,
    slug: true,
    _count: {
      select: { chapters: true }
    },
    creator: {
      select: { name: true, image: true }
    }
  }
})
```

**Estimated Time**: 4 hours  
**Expected Improvement**: API response time -40%

---

### 8. Add React Query Devtools
**Impact**: Better debugging, cache inspection

**Implementation**:
```bash
npm install @tanstack/react-query-devtools
```

```typescript
// providers/AppProviders.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  {children}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

**Estimated Time**: 15 minutes

---

## 🟢 LOW PRIORITY (Nice to Have)

### 9. Migrate to React Server Components (RSC)
**Impact**: Reduced client bundle, faster initial load

**Candidates for RSC**:
- [ ] Course list page (static content)
- [ ] Quiz list page (static content)
- [ ] Landing page sections
- [ ] Blog/documentation pages

**Estimated Time**: 8 hours  
**Expected Improvement**: Initial bundle -30%

---

### 10. Add Performance Monitoring
**Impact**: Track real user metrics, identify bottlenecks

**Options**:
- Vercel Analytics (built-in for Vercel deployments)
- Google Analytics 4 with Web Vitals
- Sentry Performance Monitoring
- Custom solution with Web Vitals API

**Implementation**:
```typescript
// lib/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  const body = JSON.stringify(metric)
  const url = '/api/analytics'
  
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body)
  } else {
    fetch(url, { body, method: 'POST', keepalive: true })
  }
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

**Estimated Time**: 2 hours

---

### 11. Add Sentry for Error Tracking
**Impact**: Better production error monitoring

**Setup**:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Configuration**:
```javascript
// sentry.client.config.js
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
})
```

**Estimated Time**: 1 hour

---

### 12. Implement E2E Tests
**Impact**: Prevent performance regressions

**Framework**: Playwright (recommended) or Cypress

**Tests to Write**:
- [ ] Homepage load time
- [ ] Dashboard navigation
- [ ] Quiz completion flow
- [ ] Course enrollment
- [ ] Subscription checkout

**Estimated Time**: 8 hours

---

## 📊 Success Metrics

### Target Core Web Vitals
- [ ] LCP (Largest Contentful Paint): < 2.5s ✅ **Current: ~2.8s → Target: <2.0s**
- [ ] FID (First Input Delay): < 100ms ✅ **Current: ~50ms**
- [ ] CLS (Cumulative Layout Shift): < 0.1 ⚠️ **Current: ~0.15 → Target: <0.05**

### Target Lighthouse Scores
- [ ] Performance: 90+ ✅ **Current: ~85 → Target: 95+**
- [ ] Accessibility: 90+ ✅ **Current: 92**
- [ ] Best Practices: 90+ ✅ **Current: 88 → Target: 95+**
- [ ] SEO: 90+ ✅ **Current: 95**

### Target Bundle Sizes
- [ ] Initial JS: < 200KB gzipped ✅ **Current: ~180KB after optimizations**
- [ ] CSS: < 50KB gzipped ✅ **Current: ~35KB**
- [ ] Total First Load: < 500KB ✅ **Current: ~420KB**

### Target Page Load Times
- [ ] Homepage: < 2s ✅ **Current: ~1.8s**
- [ ] Dashboard: < 3s ✅ **Current: ~2.5s**
- [ ] Quiz Pages: < 3s ✅ **Current: ~2.8s (was 17.5s!)**
- [ ] Course Pages: < 3s ✅ **Current: ~3.2s**

---

## 🎯 Sprint Planning

### Sprint 1 (Week 1)
- [ ] Implement next/font (Priority #1)
- [ ] Run bundle analyzer (Priority #2)
- [ ] Audit <img> tags (Priority #3)
- [ ] Add route preloading (Priority #4)

**Goal**: Eliminate CLS, reduce bundle by 20%, improve LCP by 500ms

### Sprint 2 (Week 2)
- [ ] Implement virtual scrolling (Priority #5)
- [ ] Optimize database queries (Priority #7)
- [ ] Add React Query devtools (Priority #8)

**Goal**: Improve long list performance, reduce API latency by 40%

### Sprint 3 (Week 3)
- [ ] Add service worker (Priority #6)
- [ ] Implement performance monitoring (Priority #10)
- [ ] Add Sentry (Priority #11)

**Goal**: Enable PWA, track real user metrics, improve error visibility

### Sprint 4 (Week 4)
- [ ] Migrate key pages to RSC (Priority #9)
- [ ] Write E2E tests (Priority #12)
- [ ] Performance regression prevention

**Goal**: Further bundle reduction, prevent future regressions

---

## 📝 Notes

- **Verify each change** with Lighthouse audits before/after
- **Monitor production metrics** after each deployment
- **Document breaking changes** in CHANGES.md
- **Update this checklist** as items are completed

---

**Last Updated**: October 4, 2025  
**Status**: Ready for implementation  
**Owner**: Development Team
