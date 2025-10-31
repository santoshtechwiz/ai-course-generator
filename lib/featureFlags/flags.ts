/**
 * Feature Flag Configuration
 * Central definition of all feature flags with their rules
 */

import type { FeatureFlag } from './types'

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Core System Features
  'route-protection': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    routes: ['/admin/**', '/home', '/dashboard/history/**', '/dashboard/mcq', '/dashboard/create/**'],
    requiresAuth: false, // Changed: Auth required only for specific routes, not all dashboard
    description: 'Selective route protection - exploration is public',
    version: '2.1.0'
  },

  // Dashboard & Navigation Features
  'dashboard-access': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    routes: ['/dashboard', '/home', '/dashboard/history'],
    requiresAuth: false, // Public dashboard access for exploration
    description: 'Dashboard access - public for exploration, personalized when authenticated',
    version: '1.0.0'
  },

  'course-browsing': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    routes: ['/explore', '/dashboard/explore'],
    requiresAuth: false, // Public browsing allowed
    description: 'Course browsing and exploration - public access',
    version: '1.0.0'
  },

  'course-access': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    routes: ['/dashboard/learn', '/dashboard/course/**'],
    requiresAuth: false, // Public viewing allowed, actions require auth
    description: 'Course viewing access - public for viewing, auth for actions',
    version: '1.0.0'
  },

  'quiz-access': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    routes: ['/quizzes'],
    requiresAuth: false, // Browse only, taking requires auth
    description: 'Quiz browsing access - public browsing, auth for taking quizzes',
    version: '1.0.0'
  },

  'admin-access': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    routes: ['/admin', '/admin/**'],
    userGroups: ['admin'],
    requiresAuth: true,
    description: 'Admin panel access - requires admin role',
    version: '1.0.0'
  },

  // Quiz Type Features
  'quiz-mcq': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    routes: ['/dashboard/mcq'],
    requiresAuth: false, // Public browsing - auth enforced at action level by page itself
    requiresCredits: false, // Credits checked when user clicks "Create Quiz" button
    minimumPlan: 'FREE',
    description: 'Multiple choice quiz creation - browsing public, creation requires auth (handled by page)',
    version: '1.0.0'
  },

  'quiz-openended': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    routes: ['/dashboard/openended'],
    requiresAuth: false, // Public browsing - auth enforced at action level by page itself
    requiresCredits: false, // Credits checked when user clicks "Create Quiz" button
    minimumPlan: 'FREE',
    description: 'Open-ended quiz creation - browsing public, creation requires auth (handled by page)',
    version: '1.0.0'
  },

  'quiz-blanks': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    routes: ['/dashboard/blanks'],
    requiresAuth: false, // Public browsing - auth enforced at action level by page itself
    requiresCredits: false, // Credits checked when user clicks "Create Quiz" button
    minimumPlan: 'FREE',
    description: 'Fill-in-the-blanks quiz creation - browsing public, creation requires auth (handled by page)',
    version: '1.0.0'
  },

  'quiz-code': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    routes: ['/dashboard/code'],
    requiresAuth: false, // Public browsing - auth enforced at action level by page itself
    requiresCredits: false, // Credits checked when user clicks "Create Quiz" button
    minimumPlan: 'FREE',
    description: 'Code quiz creation - browsing public, creation requires auth (handled by page)',
    version: '1.0.0'
  },

  'quiz-flashcard': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    routes: ['/dashboard/flashcard'],
    requiresAuth: false, // Public browsing - auth enforced at action level by page itself
    requiresCredits: false, // Credits checked when user clicks "Create Quiz" button
    minimumPlan: 'FREE',
    description: 'Flashcard creation - browsing public, creation requires auth (handled by page)',
    version: '1.0.0'
  },

  'quiz-ordering': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    routes: ['/dashboard/ordering'],
    requiresAuth: false, // Public browsing - auth enforced at action level by page itself
    requiresCredits: false, // Credits checked when user clicks "Create Quiz" button
    minimumPlan: 'FREE',
    description: 'Ordering quiz creation - browsing public, creation requires auth (handled by page)',
    version: '1.0.0'
  },

  'middleware-caching': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    description: 'Enable token and session caching in middleware',
    version: '1.5.0'
  },

  'performance-monitoring': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    description: 'Enable performance monitoring and logging',
    version: '1.0.0'
  },

  // Authentication & Authorization
  'admin-panel': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    routes: ['/admin/**'],
    userGroups: ['admin'],
    requiresAuth: true,
    description: 'Admin panel access control',
    version: '1.0.0'
  },

  'subscription-enforcement': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    routes: [
      '/dashboard/mcq',
      '/dashboard/openended',
      '/dashboard/blanks',
      '/dashboard/code',
      '/dashboard/flashcard'
    ],
    requiresAuth: true,
    requiresSubscription: true,
    requiresCredits: true,
    description: 'Subscription-based feature access enforcement',
    version: '2.1.0'
  },

  // Content Creation Features
  'quiz-creation': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    routes: ['/dashboard/mcq', '/dashboard/openended', '/dashboard/blanks', '/dashboard/code'],
    requiresAuth: true, // Auth required for CREATING quizzes
    requiresCredits: true,
    minimumPlan: 'FREE',
    description: 'Quiz creation functionality - browsing is public, creation requires auth',
    version: '1.1.0'
  },

  'course-creation': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    routes: ['/dashboard/create/course'],
    requiresAuth: true, // Auth required for CREATING courses
    requiresCredits: true,
    minimumPlan: 'FREE',
    description: 'Course creation functionality - viewing is public, creation requires auth',
    version: '1.1.0'
  },

  'pdf-generation': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'BASIC',
    description: 'PDF export functionality',
    dependencies: ['subscription-enforcement'],
    version: '1.2.0'
  },

  // Analytics & Insights
  'analytics': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'PREMIUM',
    description: 'Advanced analytics dashboard',
    dependencies: ['subscription-enforcement'],
    version: '1.0.0'
  },

  'enhanced-analytics': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'PREMIUM',
    rolloutPercentage: 50,
    description: 'Enhanced analytics with AI insights',
    dependencies: ['analytics'],
    version: '2.0.0-beta'
  },

  // AI Features
  'ai-recommendations': {
    enabled: true,
    environments: ['production', 'staging', 'development', 'test'],
    requiresAuth: true,
    minimumPlan: 'BASIC',
    rolloutPercentage: 75,
    description: 'AI-powered course and quiz recommendations',
    version: '1.1.0'
  },

  // Beta Features
  'beta-features': {
    enabled: true,
    environments: ['staging', 'development'],
    requiresAuth: true,
    minimumPlan: 'BASIC',
    userGroups: ['beta-testers', 'admin'],
    description: 'Access to beta features',
    version: '1.0.0-beta'
  },

  'collaborative-courses': {
    enabled: false, // Not ready for production
    environments: ['development'],
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'PREMIUM',
    userGroups: ['beta-testers'],
    description: 'Collaborative course creation',
    version: '1.0.0-alpha',
    deprecatedAt: '2025-12-31'
  },

  // Legacy Features (marked for removal)
  'legacy-quiz-builder': {
    enabled: false,
    description: 'Legacy quiz builder (deprecated)',
    deprecatedAt: '2025-01-01',
    removedAt: '2025-06-01',
    version: '0.9.0'
  }
} as const

// Type-safe feature flag names
type FeatureFlagName = keyof typeof FEATURE_FLAGS

// Helper to get all route-based features
export function getRouteFeatures(): Record<string, string[]> {
  const routeFeatures: Record<string, string[]> = {}
  
  Object.entries(FEATURE_FLAGS).forEach(([flagName, flag]) => {
    if (flag.routes) {
      flag.routes.forEach(route => {
        if (!routeFeatures[route]) {
          routeFeatures[route] = []
        }
        routeFeatures[route].push(flagName)
      })
    }
  })
  
  return routeFeatures
}

// Helper to get features by environment
function getFeaturesByEnvironment(env: string): string[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([, flag]) => !flag.environments || flag.environments.includes(env))
    .map(([flagName]) => flagName)
}

// Helper to get subscription-required features
export function getSubscriptionFeatures(): string[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([, flag]) => flag.requiresSubscription)
    .map(([flagName]) => flagName)
}

// Helper to check if a feature is enabled for a specific plan
export function isFeatureEnabledForPlan(plan: string, featureFlag: string): boolean {
  // Import here to avoid circular dependencies
  const { PLAN_CONFIGURATIONS } = require('@/types/subscription-plans')
  
  const planConfig = PLAN_CONFIGURATIONS[plan as keyof typeof PLAN_CONFIGURATIONS]
  if (!planConfig) return false
  
  return planConfig.featureFlags[featureFlag] || false
}