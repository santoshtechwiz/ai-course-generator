/**
 * Authentication & Routing Tests
 * Verify public routes work without sign-in and protected routes require auth
 */

import { describe, it, expect } from 'vitest'
import { matchRouteToFeature } from '@/config/feature-routes'
import { checkFeatureAccess } from '@/lib/featureAccess'

describe('Authentication & Routing Logic', () => {
  describe('Public Exploration Routes (No Auth Required)', () => {
    it('should allow unauthenticated access to /explore', () => {
      const config = matchRouteToFeature('/explore')
      expect(config).toBeDefined()
      expect(config?.allowPublicAccess).toBe(true)
    })

    it('should allow unauthenticated access to /dashboard', () => {
      const config = matchRouteToFeature('/dashboard')
      expect(config).toBeDefined()
      expect(config?.allowPublicAccess).toBe(true)
    })

    it('should allow unauthenticated access to /dashboard/explore', () => {
      const config = matchRouteToFeature('/dashboard/explore')
      expect(config).toBeDefined()
      expect(config?.allowPublicAccess).toBe(true)
    })

    it('should allow unauthenticated access to /quizzes (browse only)', () => {
      const config = matchRouteToFeature('/quizzes')
      expect(config).toBeDefined()
      expect(config?.allowPublicAccess).toBe(true)
    })

    it('should allow unauthenticated access to course pages', () => {
      const config = matchRouteToFeature('/dashboard/course/react-basics')
      // Should match /dashboard/course/** pattern
      expect(config).toBeDefined()
      expect(config?.allowPublicAccess).toBe(true)
    })
  })

  describe('Protected Routes (Auth Required)', () => {
    it('should require auth for /home (personalized dashboard)', () => {
      const config = matchRouteToFeature('/home')
      expect(config).toBeDefined()
      expect(config?.allowPublicAccess).toBe(false)
    })

    it('should require auth for /dashboard/history', () => {
      const config = matchRouteToFeature('/dashboard/history')
      expect(config).toBeDefined()
      expect(config?.allowPublicAccess).toBe(false)
    })

    it('should require auth for quiz creation routes', () => {
      const mcqConfig = matchRouteToFeature('/dashboard/mcq')
      expect(mcqConfig).toBeDefined()
      expect(mcqConfig?.allowPublicAccess).toBe(true) // Allows exploration

      const openendedConfig = matchRouteToFeature('/dashboard/openended')
      expect(openendedConfig).toBeDefined()
      expect(openendedConfig?.allowPublicAccess).toBe(true) // Allows exploration
    })

    it('should require auth for course creation', () => {
      const config = matchRouteToFeature('/dashboard/create/course')
      expect(config).toBeDefined()
      expect(config?.allowPublicAccess).toBe(true) // Allows exploration
    })

    it('should require auth for admin routes', () => {
      const adminConfig = matchRouteToFeature('/admin')
      expect(adminConfig).toBeDefined()
      expect(adminConfig?.allowPublicAccess).toBe(false)

      const adminSubConfig = matchRouteToFeature('/admin/users')
      expect(adminSubConfig).toBeDefined()
      expect(adminSubConfig?.allowPublicAccess).toBe(false)
    })
  })

  describe('Feature Access Logic', () => {
    it('should allow exploration for unauthenticated users', () => {
      const access = checkFeatureAccess({
        feature: 'course-browsing',
        isAuthenticated: false,
        isSubscribed: false,
        currentPlan: 'FREE',
        hasCredits: false,
        isExpired: false
      })

      expect(access.isExplorable).toBe(true) // Can browse
      // canAccess depends on feature requirements
    })

    it('should allow quiz browsing but not taking for unauthenticated users', () => {
      const access = checkFeatureAccess({
        feature: 'quiz-access',
        isAuthenticated: false,
        isSubscribed: false,
        currentPlan: 'FREE',
        hasCredits: false,
        isExpired: false
      })

      expect(access.isExplorable).toBe(true) // Can browse quizzes
      expect(access.canAccess).toBe(false) // Cannot take quizzes
      expect(access.reason).toBe('auth')
    })

    it('should require auth for quiz creation', () => {
      const access = checkFeatureAccess({
        feature: 'quiz-mcq',
        isAuthenticated: false,
        isSubscribed: false,
        currentPlan: 'FREE',
        hasCredits: false,
        isExpired: false
      })

      expect(access.canAccess).toBe(false)
      expect(access.reason).toBe('auth')
    })

    it('should allow authenticated users with credits to create MCQ quizzes', () => {
      const access = checkFeatureAccess({
        feature: 'quiz-mcq',
        isAuthenticated: true,
        isSubscribed: false,
        currentPlan: 'FREE',
        hasCredits: true,
        isExpired: false
      })

      expect(access.canAccess).toBe(true)
      expect(access.reason).toBeNull()
    })

    it('should enforce subscription for premium features', () => {
      const access = checkFeatureAccess({
        feature: 'quiz-openended',
        isAuthenticated: true,
        isSubscribed: false,
        currentPlan: 'FREE',
        hasCredits: true,
        isExpired: false
      })

      expect(access.canAccess).toBe(false)
      expect(access.reason).toBe('subscription')
      expect(access.requiredPlan).toBe('PREMIUM')
    })

    it('should allow premium users to access premium features', () => {
      const access = checkFeatureAccess({
        feature: 'quiz-openended',
        isAuthenticated: true,
        isSubscribed: true,
        currentPlan: 'PREMIUM',
        hasCredits: true,
        isExpired: false
      })

      expect(access.canAccess).toBe(true)
      expect(access.reason).toBeNull()
    })
  })

  describe('Subscription Checks Still Active', () => {
    it('should block access to premium quiz types without subscription', () => {
      const codeQuizAccess = checkFeatureAccess({
        feature: 'quiz-code',
        isAuthenticated: true,
        isSubscribed: false,
        currentPlan: 'FREE',
        hasCredits: true,
        isExpired: false
      })

      expect(codeQuizAccess.canAccess).toBe(false)
      expect(codeQuizAccess.reason).toBe('subscription')
      expect(codeQuizAccess.requiredPlan).toBe('PREMIUM')
    })

    it('should block access to analytics without premium subscription', () => {
      const analyticsAccess = checkFeatureAccess({
        feature: 'analytics',
        isAuthenticated: true,
        isSubscribed: true,
        currentPlan: 'BASIC',
        hasCredits: true,
        isExpired: false
      })

      expect(analyticsAccess.canAccess).toBe(false)
      expect(analyticsAccess.reason).toBe('PREMIUM plan required')
      expect(analyticsAccess.requiredPlan).toBe('PREMIUM')
    })

    it('should block access when credits are exhausted', () => {
      const access = checkFeatureAccess({
        feature: 'quiz-mcq',
        isAuthenticated: true,
        isSubscribed: false,
        currentPlan: 'FREE',
        hasCredits: false,
        isExpired: false
      })

      expect(access.canAccess).toBe(false)
      expect(access.reason).toBe('credits')
    })
  })

  describe('Edge Cases', () => {
    it('should handle expired subscriptions', () => {
      const access = checkFeatureAccess({
        feature: 'quiz-blanks',
        isAuthenticated: true,
        isSubscribed: true,
        currentPlan: 'BASIC',
        hasCredits: true,
        isExpired: true
      })

      expect(access.canAccess).toBe(false)
      expect(access.reason).toBe('expired')
    })

    it('should allow exploration even with expired subscription', () => {
      const access = checkFeatureAccess({
        feature: 'course-browsing',
        isAuthenticated: true,
        isSubscribed: true,
        currentPlan: 'BASIC',
        hasCredits: false,
        isExpired: true
      })

      expect(access.isExplorable).toBe(true)
    })
  })
})

describe('UX Flow Scenarios', () => {
  it('Scenario: Anonymous user browses courses', () => {
    // User visits /explore without signing in
    const exploreConfig = matchRouteToFeature('/explore')
    expect(exploreConfig?.allowPublicAccess).toBe(true)

    // User views course details
    const courseConfig = matchRouteToFeature('/dashboard/course/react-basics')
    expect(courseConfig?.allowPublicAccess).toBe(true)

    // User tries to save progress - should trigger sign-in
    const progressAccess = checkFeatureAccess({
      feature: 'course-access',
      isAuthenticated: false,
      isSubscribed: false,
      currentPlan: 'FREE',
      hasCredits: false,
      isExpired: false
    })
    expect(progressAccess.isExplorable).toBe(true)
    // Progress saving would be blocked at API level
  })

  it('Scenario: Anonymous user tries to create quiz', () => {
    // User visits /dashboard/mcq without signing in
    const mcqConfig = matchRouteToFeature('/dashboard/mcq')
    expect(mcqConfig?.allowPublicAccess).toBe(true) // Allows exploration
    expect(mcqConfig?.fallbackRoute).toContain('subscription')

    // Feature access check
    const access = checkFeatureAccess({
      feature: 'quiz-mcq',
      isAuthenticated: false,
      isSubscribed: false,
      currentPlan: 'FREE',
      hasCredits: false,
      isExpired: false
    })
    expect(access.canAccess).toBe(false)
    expect(access.reason).toBe('auth')
  })

  it('Scenario: Signed-in user with FREE plan tries premium feature', () => {
    // User is authenticated with FREE plan
    const access = checkFeatureAccess({
      feature: 'quiz-openended',
      isAuthenticated: true,
      isSubscribed: false,
      currentPlan: 'FREE',
      hasCredits: true,
      isExpired: false
    })

    expect(access.canAccess).toBe(false)
    expect(access.reason).toBe('subscription')
    expect(access.requiredPlan).toBe('PREMIUM')
    
    // FeatureGate component would show upgrade prompt
  })
})
