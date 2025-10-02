import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SubscriptionService } from '@/modules/subscriptions'
import { CreditOperationType } from '@/services/credit-service'

// Mock global fetch
const fetchMock = vi.fn()
global.fetch = fetchMock

// Mock prisma globally
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    userSubscription: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  }
}))

describe('Subscription Synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('SubscriptionService.activateFreePlan', () => {
    it('successfully activates free plan', async () => {
      const mockResponse = {
        success: true,
        data: {
          subscriptionPlan: 'FREE',
          status: 'ACTIVE',
          credits: 5,
          tokensUsed: 0,
          isSubscribed: true,
          currentPeriodEnd: '2025-12-31T23:59:59.999Z'
        }
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await SubscriptionService.activateFreePlan('user-123')

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/subscriptions/activate-free',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirmed: true }),
          credentials: 'include'
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('handles activation failure', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Already subscribed to paid plan' })
      })

      await expect(SubscriptionService.activateFreePlan('user-123')).rejects.toThrow()
    })
  })

  describe('SubscriptionService.getSubscriptionStatus', () => {
    it('returns subscription data when successful', async () => {
      const mockData = {
        subscriptionPlan: 'FREE',
        status: 'ACTIVE',
        credits: 5,
        tokensUsed: 0,
        isSubscribed: true
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockData
        })
      })

      const result = await SubscriptionService.getSubscriptionStatus('user-123')

      expect(result).toEqual(mockData)
    })

    it('returns null when request fails', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const result = await SubscriptionService.getSubscriptionStatus('user-123')

      expect(result).toBeNull()
    })
  })

  describe('CreditService integration', () => {
    it('validates subscription before credit operations', async () => {
      const { creditService } = await import('@/services/credit-service')
      const { prisma } = await import('@/lib/db')

      // Mock user as active
      ;(prisma.user.findUnique as any).mockResolvedValue({
        id: 'user-123',
        isActive: true,
        credits: 10,
        creditsUsed: 0
      })

  // No legacy subscriptionActive column in schema; rely on isActive

      // Mock validateCredits to fail
      const originalValidate = creditService.validateCredits
      creditService.validateCredits = vi.fn().mockResolvedValue({
        canProceed: false,
        currentBalance: 0,
        requiredCredits: 1,
        hasCredits: false
      })

      try {
        const result = await creditService.executeCreditsOperation(
          'user-123',
          1,
          CreditOperationType.QUIZ_CREATION
        )

        expect(result.success).toBe(false)
        expect(result.error).toContain('Insufficient')
      } finally {
        creditService.validateCredits = originalValidate
      }
    })
  })
})
