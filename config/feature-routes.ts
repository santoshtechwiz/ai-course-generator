/**
 * Route Feature Mapping Configuration
 * Maps routes to their required features and fallback behavior
 */

import type { RouteFeatureConfig } from '../lib/featureFlags/types'

const ROUTE_FEATURE_MAP: Record<string, RouteFeatureConfig> = {
  // Public Exploration Routes (no auth required for browsing)
  '/explore': {
    feature: 'course-browsing',
    featureFlag: 'route-protection',
    allowPublicAccess: true
  },
  '/dashboard': {
    feature: 'dashboard-access',
    featureFlag: 'route-protection',
    allowPublicAccess: true
  },
  '/dashboard/explore': {
    feature: 'course-browsing',
    featureFlag: 'route-protection',
    allowPublicAccess: true
  },
  '/dashboard/learn': {
    feature: 'course-access',
    featureFlag: 'route-protection',
    allowPublicAccess: true
  },
  '/quizzes': {
    feature: 'quiz-access',
    featureFlag: 'route-protection',
    allowPublicAccess: true // Browse only, taking requires auth
  },
  '/dashboard/course/**': {
    feature: 'course-access',
    featureFlag: 'route-protection',
    allowPublicAccess: true // View only, actions require auth
  },

  // Personalized Routes (auth required)
  '/home': {
    feature: 'dashboard-access',
    featureFlag: 'route-protection',
    allowPublicAccess: false // Personal dashboard requires auth
  },
  '/dashboard/history': {
    feature: 'dashboard-access',
    featureFlag: 'route-protection',
    allowPublicAccess: false
  },

  // Admin Routes (auth + admin role required)
  '/admin': {
    feature: 'admin-access',
    featureFlag: 'admin-panel',
    fallbackRoute: '/unauthorized?reason=admin',
    allowPublicAccess: false
  },
  '/admin/**': {
    feature: 'admin-access',
    featureFlag: 'admin-panel',
    fallbackRoute: '/unauthorized?reason=admin',
    allowPublicAccess: false
  },

  // Quiz Creation Routes (public exploration, auth required for creation actions)
  '/dashboard/mcq': {
    feature: 'quiz-mcq',
    featureFlag: 'quiz-creation',
    fallbackRoute: '/dashboard/subscription?feature=quiz-mcq',
    allowPublicAccess: true // Explore freely, auth on create button click
  },
  '/dashboard/openended': {
    feature: 'quiz-openended',
    featureFlag: 'quiz-creation',
    fallbackRoute: '/dashboard/subscription?feature=quiz-openended',
    allowPublicAccess: true // Explore freely, auth on create button click
  },
  '/dashboard/blanks': {
    feature: 'quiz-blanks',
    featureFlag: 'quiz-creation',
    fallbackRoute: '/dashboard/subscription?feature=quiz-blanks',
    allowPublicAccess: true // Explore freely, auth on create button click
  },
  '/dashboard/code': {
    feature: 'quiz-code',
    featureFlag: 'quiz-creation',
    fallbackRoute: '/dashboard/subscription?feature=quiz-code',
    allowPublicAccess: true // Explore freely, auth on create button click
  },
  '/dashboard/flashcard': {
    feature: 'quiz-flashcard',
    featureFlag: 'quiz-creation',
    fallbackRoute: '/dashboard/subscription?feature=quiz-flashcard',
    allowPublicAccess: true // Explore freely, auth on create button click
  },
  '/dashboard/ordering': {
    feature: 'quiz-ordering',
    featureFlag: 'quiz-creation',
    fallbackRoute: '/dashboard/subscription?feature=quiz-ordering',
    allowPublicAccess: true // Explore freely, auth on create button click
  },
  '/dashboard/document': {
    feature: 'pdf-generation',
    featureFlag: 'quiz-creation',
    fallbackRoute: '/dashboard/subscription?feature=pdf-generation',
    allowPublicAccess: true // Explore freely, auth on create button click
  },

  // Course Creation (public exploration, auth required for creation actions)
  '/dashboard/create': {
    feature: 'course-creation',
    featureFlag: 'course-creation',
    fallbackRoute: '/dashboard/subscription?feature=course-creation',
    allowPublicAccess: true // Explore freely, auth on create button click
  },
  '/dashboard/create/course': {
    feature: 'course-creation',
    featureFlag: 'course-creation',
    fallbackRoute: '/dashboard/subscription?feature=course-creation',
    allowPublicAccess: true // Explore freely, auth on create button click
  },

  // Analytics (auth + subscription required)
  '/dashboard/analytics': {
    feature: 'analytics',
    featureFlag: 'analytics',
    fallbackRoute: '/dashboard/subscription?plan=PREMIUM',
    allowPublicAccess: false
  }
}

// Route patterns for matching
const ROUTE_PATTERNS = {
  ADMIN: /^\/admin(\/.*)?$/,
  QUIZ_CREATION: /^\/dashboard\/(mcq|openended|blanks|code|flashcard|ordering)$/,
  COURSE_CREATION: /^\/dashboard\/create\/course$/,
  ANALYTICS: /^\/dashboard\/analytics/,
  DASHBOARD: /^\/dashboard$/,
  PUBLIC_DASHBOARD: /^\/dashboard\/(explore|learn)/
} as const

/**
 * Match route to feature configuration
 */
export function matchRouteToFeature(pathname: string): RouteFeatureConfig | null {
  // Exact match first
  const exactMatch = ROUTE_FEATURE_MAP[pathname]
  if (exactMatch) {
    return exactMatch
  }

  // Pattern matching
  for (const [pattern, config] of Object.entries(ROUTE_FEATURE_MAP)) {
    if (pattern.includes('**')) {
      const basePattern = pattern.replace('/**', '')
      if (pathname.startsWith(basePattern)) {
        return config
      }
    }
  }

  // Pattern-based matching using regex
  if (ROUTE_PATTERNS.ADMIN.test(pathname)) {
    return ROUTE_FEATURE_MAP['/admin/**']
  }

  if (ROUTE_PATTERNS.QUIZ_CREATION.test(pathname)) {
    const type = pathname.split('/').pop()
    return ROUTE_FEATURE_MAP[`/dashboard/${type}`]
  }

  return null
}

/**
 * Get all protected routes
 */
function getProtectedRoutes(): string[] {
  return Object.keys(ROUTE_FEATURE_MAP).filter(route => {
    const config = ROUTE_FEATURE_MAP[route]
    return !config.allowPublicAccess
  })
}

/**
 * Get public routes that still need auth
 */
function getPublicAuthRoutes(): string[] {
  return Object.keys(ROUTE_FEATURE_MAP).filter(route => {
    const config = ROUTE_FEATURE_MAP[route]
    return config.allowPublicAccess === true
  })
}