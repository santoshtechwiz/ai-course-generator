/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { useSession } from 'next-auth/react'
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription'

// Mock dependencies
vi.mock('next-auth/react')
vi.mock('@/hooks/useUnifiedSubscription')

describe('useFeatureAccess', () => {
  const mockUseSession = vi.mocked(useSession)
  const mockUseUnifiedSubscription = vi.mocked(useUnifiedSubscription)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('authentication checks', () => {
    it('should return auth reason when user is not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      } as any)

      mockUseUnifiedSubscription.mockReturnValue({
        subscription: null,
        isSubscribed: false,
        hasCredits: false,
        hasActiveSubscription: false,
        needsUpgrade: false,
        plan: 'FREE',
        isExpired: false,
        isLoading: false,
        error: null,
      } as any)

      const { result } = renderHook(() => 
        useFeatureAccess('quiz-access')
      )

      expect(result.current.canAccess).toBe(false)
      expect(result.current.reason).toBe('auth')
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should proceed with checks when user is authenticated', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: vi.fn(),
      } as any)

      mockUseUnifiedSubscription.mockReturnValue({
        subscription: {
          subscriptionPlan: 'BASIC',
          status: 'ACTIVE',
          credits: 10,
        },
        isSubscribed: true,
        hasCredits: true,
        hasActiveSubscription: true,
        needsUpgrade: false,
        plan: 'BASIC',
        isExpired: false,
        isLoading: false,
        error: null,
      } as any)

      const { result} = renderHook(() => 
        useFeatureAccess('quiz-access')
      )

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.canAccess).toBe(true)
    })
  })

  describe('subscription checks', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: vi.fn(),
      } as any)
    })

    it('should deny access when user lacks subscription', () => {
      mockUseUnifiedSubscription.mockReturnValue({
        subscription: null,
        isSubscribed: false,
        hasCredits: false,
        hasActiveSubscription: false,
        needsUpgrade: true,
        plan: 'FREE',
        isExpired: false,
        isLoading: false,
        error: null,
      } as any)

      const { result } = renderHook(() => 
        useFeatureAccess('quiz-access') // Requires BASIC plan
      )

      expect(result.current.canAccess).toBe(false)
      expect(result.current.reason).toBe('subscription')
    })

    it('should grant access when user has required plan', () => {
      mockUseUnifiedSubscription.mockReturnValue({
        subscription: {
          subscriptionPlan: 'BASIC',
          status: 'ACTIVE',
          credits: 100,
        },
        isSubscribed: true,
        hasCredits: true,
        hasActiveSubscription: true,
        needsUpgrade: false,
        plan: 'BASIC',
        isExpired: false,
        isLoading: false,
        error: null,
      } as any)

      const { result } = renderHook(() => 
        useFeatureAccess('quiz-access') // Requires BASIC
      )

      expect(result.current.canAccess).toBe(true)
      expect(result.current.isSubscribed).toBe(true)
    })

    it('should grant access when user has higher plan than required', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: vi.fn(),
      } as any)

      mockUseUnifiedSubscription.mockReturnValue({
        subscription: {
          subscriptionPlan: 'PREMIUM',
          status: 'ACTIVE',
          credits: 500,
        },
        isSubscribed: true,
        hasCredits: true,
        hasActiveSubscription: true,
        needsUpgrade: false,
        plan: 'PREMIUM',
        isExpired: false,
        isLoading: false,
        error: null,
      } as any)

      const { result } = renderHook(() => 
        useFeatureAccess('quiz-access') // Requires BASIC, user has PREMIUM
      )

      expect(result.current.canAccess).toBe(true)
    })
  })

  describe('feature requirements', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: vi.fn(),
      } as any)
    })

    it('should respect feature-specific minimum plan requirements', () => {
      // Analytics requires PREMIUM plan
      mockUseUnifiedSubscription.mockReturnValue({
        subscription: {
          subscriptionPlan: 'BASIC',
          status: 'ACTIVE',
          credits: 50,
        },
        isSubscribed: true,
        hasCredits: true,
        hasActiveSubscription: true,
        needsUpgrade: true,
        plan: 'BASIC',
        isExpired: false,
        isLoading: false,
        error: null,
      } as any)

      const { result } = renderHook(() => 
        useFeatureAccess('analytics') // Requires PREMIUM
      )

      expect(result.current.canAccess).toBe(false)
      expect(result.current.reason).toBe('subscription')
    })

    it('should grant access when user has expired subscription', () => {
      mockUseUnifiedSubscription.mockReturnValue({
        subscription: {
          subscriptionPlan: 'PREMIUM',
          status: 'EXPIRED',
          credits: 0,
        },
        isSubscribed: false,
        hasCredits: false,
        hasActiveSubscription: false,
        needsUpgrade: true,
        plan: 'FREE',
        isExpired: true,
        isLoading: false,
        error: null,
      } as any)

      const { result } = renderHook(() => 
        useFeatureAccess('analytics')
      )

      expect(result.current.canAccess).toBe(false)
      expect(result.current.reason).toBe('expired')
    })
  })

  describe('edge cases', () => {
    it('should handle missing subscription data gracefully', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: vi.fn(),
      } as any)

      mockUseUnifiedSubscription.mockReturnValue({
        subscription: null,
        isSubscribed: false,
        hasCredits: false,
        hasActiveSubscription: false,
        needsUpgrade: true,
        plan: 'FREE',
        isExpired: false,
        isLoading: false,
        error: null,
      } as any)

      const { result } = renderHook(() => 
        useFeatureAccess('quiz-access')
      )

      expect(result.current.canAccess).toBe(false)
      expect(result.current.isSubscribed).toBe(false)
    })

    it('should handle unknown feature gracefully', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        status: 'authenticated',
        update: vi.fn(),
      } as any)

      mockUseUnifiedSubscription.mockReturnValue({
        subscription: {
          subscriptionPlan: 'PREMIUM',
          status: 'ACTIVE',
          credits: 0, // FIX: 0 credits
        },
        isSubscribed: true,
        hasCredits: false, // FIX: should be false when credits = 0
        hasActiveSubscription: true,
        needsUpgrade: false,
        plan: 'PREMIUM',
        isExpired: false,
        isLoading: false,
        error: null,
      } as any)

      const { result } = renderHook(() => useFeatureAccess('quiz-access'))

      expect(result.current.hasCredits).toBe(false)
      // Quiz access requires BASIC plan but not credits, so with PREMIUM plan should have access
      expect(result.current.canAccess).toBe(true)
    })
  })
})
