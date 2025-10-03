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
      findFirst: vi.fn(),
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
    it('successfully activates free plan (prisma mocked)', async () => {
      const { prisma } = await import('@/lib/db')
      const now = new Date()
      ;(prisma.userSubscription.findFirst as any).mockResolvedValue(null)
      ;(prisma.userSubscription.create as any).mockResolvedValue({
        id: 'sub_free', userId: 'user-123', planId: 'FREE', status: 'ACTIVE', currentPeriodStart: now, currentPeriodEnd: new Date(now.getTime()+86400000)
      })
      ;(prisma.user.update as any).mockResolvedValue({ id: 'user-123', credits: 50, creditsUsed: 0 })
      // For getSubscriptionStatus internals
      ;(prisma.user.findUnique as any).mockResolvedValue({
        id: 'user-123', credits: 50, creditsUsed: 0, subscription: { id: 'sub_free', planId: 'FREE', status: 'ACTIVE', currentPeriodEnd: new Date(now.getTime()+86400000), cancelAtPeriodEnd: false, createdAt: now, updatedAt: now }
      })

      const result = await SubscriptionService.activateFreePlan('user-123')
      expect(result.success).toBe(true)
      expect(result.data?.subscriptionPlan).toBe('FREE')
      expect(result.data?.status).toBe('ACTIVE')
      expect(result.data?.isSubscribed).toBe(true)
    })

    it('handles activation failure (throws)', async () => {
      const { prisma } = await import('@/lib/db')
      ;(prisma.userSubscription.findFirst as any).mockRejectedValue(new Error('db down'))
      await expect(SubscriptionService.activateFreePlan('user-123')).rejects.toThrow('db down')
    })
  })

  describe('SubscriptionService.getSubscriptionStatus', () => {
    it('returns subscription data when successful (flat shape)', async () => {
      const { prisma } = await import('@/lib/db')
      const now = new Date()
      ;(prisma.user.findUnique as any).mockResolvedValue({
        id: 'user-123', credits: 50, creditsUsed: 0, subscription: { id: 'sub_free', planId: 'FREE', status: 'ACTIVE', currentPeriodEnd: new Date(now.getTime()+86400000), cancelAtPeriodEnd: false, createdAt: now, updatedAt: now }
      })
      const result = await SubscriptionService.getSubscriptionStatus('user-123')
      expect(result).toMatchObject({
        subscriptionPlan: 'FREE',
        status: 'ACTIVE',
        isSubscribed: true
      })
    })

    it('returns default free object when request fails', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const result = await SubscriptionService.getSubscriptionStatus('user-123')
      expect(result).not.toBeNull()
      expect(result?.subscriptionPlan).toBe('FREE')
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