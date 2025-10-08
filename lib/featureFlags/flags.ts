/**
 * Feature Flag Configuration
 * Central definition of all feature flags with their rules
 */

import type { FeatureFlag } from './types'

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Core System Features
  'route-protection': {
    enabled: true,
    environments: ['production', 'staging', 'development'],
    routes: ['/admin/**', '/home', '/dashboard/history/**', '/dashboard/mcq', '/dashboard/create/**'],
    requiresAuth: false, // Changed: Auth required only for specific routes, not all dashboard
    description: 'Selective route protection - exploration is public',
    version: '2.1.0'
  },

  'middleware-caching': {
    enabled: true,
    environments: ['production', 'staging'],
    description: 'Enable token and session caching in middleware',
    version: '1.5.0'
  },

  'performance-monitoring': {
    enabled: true,
    environments: ['production', 'staging'],
    description: 'Enable performance monitoring and logging',
    version: '1.0.0'
  },

  // Authentication & Authorization
  'admin-panel': {
    enabled: true,
    environments: ['production', 'staging', 'development'],
    routes: ['/admin/**'],
    userGroups: ['admin'],
    requiresAuth: true,
    description: 'Admin panel access control',
    version: '1.0.0'
  },

  'subscription-enforcement': {
    enabled: true,
    environments: ['production', 'staging'],
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
    environments: ['production', 'staging', 'development'],
    routes: ['/dashboard/mcq', '/dashboard/openended', '/dashboard/blanks', '/dashboard/code'],
    requiresAuth: true, // Auth required for CREATING quizzes
    requiresCredits: true,
    minimumPlan: 'FREE',
    description: 'Quiz creation functionality - browsing is public, creation requires auth',
    version: '1.1.0'
  },

  'course-creation': {
    enabled: true,
    environments: ['production', 'staging', 'development'],
    routes: ['/dashboard/create/course'],
    requiresAuth: true, // Auth required for CREATING courses
    requiresCredits: true,
    minimumPlan: 'FREE',
    description: 'Course creation functionality - viewing is public, creation requires auth',
    version: '1.1.0'
  },

  'pdf-generation': {
    enabled: true,
    environments: ['production', 'staging'],
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
    environments: ['production', 'staging'],
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'PREMIUM',
    description: 'Advanced analytics dashboard',
    dependencies: ['subscription-enforcement'],
    version: '1.0.0'
  },

  'enhanced-analytics': {
    enabled: true,
    environments: ['production', 'staging'],
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
    environments: ['production', 'staging'],
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
export type FeatureFlagName = keyof typeof FEATURE_FLAGS

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
export function getFeaturesByEnvironment(env: string): string[] {
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