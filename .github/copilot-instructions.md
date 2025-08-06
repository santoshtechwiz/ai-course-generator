# AI Learning Platform - Copilot Instructions

## Architecture Overview

This is a **Next.js 14+ full-stack AI learning platform** with TypeScript, Prisma, PostgreSQL, and NextAuth. The app generates educational content (courses, quizzes, flashcards) using AI and provides analytics for learners.

### Core Structure
- **`app/`** - Next.js App Router with API routes in `api/`
- **`components/`** - Organized by domain: `features/`, `ui/`, `dashboard/`, `common/`
- **`hooks/`** - Custom hooks with SWR for data fetching (see `useUserDashboardOptimized.ts`)
- **`store/`** - Redux Toolkit with persistence for client state
- **`prisma/`** - Database schema and migrations
- **`lib/`** - Utilities, auth configuration, and shared services

## Key Patterns & Conventions

### Data Fetching Strategy
- **SWR with custom fetchers** for dashboard data (`hooks/useUserDashboardOptimized.ts`)
- **Server Actions** in `app/actions/` for mutations and server-side data fetching
- **API Routes** follow RESTful patterns: `/api/dashboard/user/[id]`, `/api/quizzes/[type]/[slug]`
- **Abort controllers** manage request cancellation to prevent "signal aborted" errors

### Component Organization
```
components/
├── ui/           # Shadcn/ui base components
├── features/     # Domain-specific components (quiz/, course/, subscription/)
├── dashboard/    # Dashboard-specific layouts and tabs
├── common/       # Reusable components across domains
└── shared/       # App-wide components (Footer, Navigation)
```

### State Management
- **Redux Toolkit** for global state (quiz progress, course bookmarks, subscription status)
- **SWR** for server state with aggressive caching and background updates
- **NextAuth session** for authentication state
- **Persistence** via redux-persist for quiz/course progress

### Type System
- **Domain-specific types** in `app/types/`: `quiz-types.ts`, `course-types.ts`, `user-types.ts`
- **Prisma-generated types** extended with custom interfaces
- **Strict TypeScript** - avoid `any`, use proper generic constraints

## Critical Workflows

### Development Commands
```bash
npm run dev              # Start with style validation
npm run test:watch       # Jest with watch mode
npm run test:coverage    # Coverage reports
npm run dev:migrate      # Run Prisma migrations in dev
npm run check-consistency # Validate subscription data consistency
```

### Quiz System Architecture
Quiz types are strongly typed (`QuizType: "mcq" | "openended" | "blanks" | "code"`) with:
- **Generation**: AI creates questions via `/api/quizzes/[type]/generate`
- **Storage**: Questions stored as JSON in `userQuizzes` table
- **Attempts**: Tracked in `userQuizAttempts` with detailed question responses
- **Results**: Use `QuizResultsDialog` component for viewing attempts

### Dashboard Data Flow
1. **Authentication**: NextAuth session provides user context
2. **Data Loading**: `useDashboardData()` hook combines user + stats via SWR
3. **Tab Components**: `OverviewTab`, `QuizzesTab`, `CoursesTab`, `StatsTab` consume hook data
4. **Error Handling**: Global error boundaries with retry mechanisms

### Database Patterns
- **Soft deletes** for user content (courses, quizzes)
- **JSON columns** for flexible data (quiz questions, progress tracking)
- **Optimistic updates** in UI before server confirmation
- **Subscription modeling** with usage tracking and plan limits

## Integration Points

### External Dependencies
- **NextAuth providers**: Google, GitHub, Facebook, LinkedIn
- **Stripe**: Subscription management with webhooks
- **AI Services**: OpenAI API for content generation
- **Email**: SendGrid for transactional emails
- **Analytics**: Google Analytics integration

### Error Handling Patterns
```typescript
// SWR error handling with abort controller cleanup
shouldRetryOnError: (error: any) => {
  if (!isMountedRef.current) return false
  if (error?.status >= 400 && error?.status < 500) return false
  if (error?.isAborted || error?.isNetworkError) return false
  return error?.status >= 500
}
```

### Component Patterns
- **"use client"** directive for interactive components
- **Dynamic imports** for dashboard tabs to improve performance
- **Memo optimization** for expensive renders
- **Error boundaries** with fallback UI and retry actions

## Project-Specific Conventions

### File Naming
- **Pages**: `page.tsx` (App Router convention)
- **Components**: PascalCase, descriptive names (`QuizResultsDialog.tsx`)
- **Hooks**: `use` prefix, domain-specific (`useUserDashboardOptimized.ts`)
- **Types**: Domain suffixed (`quiz-types.ts`, `user-types.ts`)

### CSS/Styling
- **Tailwind CSS** with custom design system in `tailwind.config.ts`
- **Shadcn/ui** components as base layer
- **CSS Variables** for theming (dark/light mode support)
- **Responsive design** with mobile-first approach

### Testing Strategy
- **Jest** with custom reporters and performance monitoring
- **Component testing** for UI interactions
- **API route testing** for backend logic
- **Subscription consistency checks** via custom scripts

When working on this codebase, prioritize type safety, follow the established SWR patterns for data fetching, and maintain the domain-driven component organization.
