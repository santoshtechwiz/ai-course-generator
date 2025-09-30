import { describe, it, expect, vi } from 'vitest'
import { creditService, CreditOperationType } from '@/services/credit-service'

// Mock prisma globally for all tests
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  }
}))

describe('CreditService', () => {
  it('validateCredits returns false when user not found (throws)', async () => {
    // We can't hit real DB in unit tests; ensure validateCredits throws for unknown user by mocking prisma
    const { prisma } = await import('@/lib/db')
    const originalPrisma = prisma
    try {
      prisma.$transaction = vi.fn().mockRejectedValue(new Error('User not found'))

      await expect(creditService.validateCredits('nonexistent', 1)).rejects.toThrow()
    } finally {
      // Restore original prisma
      Object.assign(prisma, originalPrisma)
    }
  })

  it('executeCreditsOperation returns insufficient when validate fails', async () => {
    const { prisma } = await import('@/lib/db')

    // Mock user as active and subscribed
    ;(prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      isActive: true,
      credits: 10,
      creditsUsed: 0
    })

  // No legacy subscriptionActive column; tests rely on isActive mock above

    // Mock validateCredits to return canProceed=false
    const originalValidate = (creditService as any).validateCredits
    try {
      ;(creditService as any).validateCredits = vi.fn().mockResolvedValue({
        canProceed: false,
        currentBalance: 0,
        requiredCredits: 1,
        hasCredits: false,
        details: {
          userCredits: 0,
          subscriptionCredits: 0,
          totalCredits: 0,
          used: 0,
          remaining: 0
        }
      })

      const res = await creditService.executeCreditsOperation('user-1', 1, CreditOperationType.QUIZ_CREATION)
      expect(res.success).toBe(false)
      expect(res.error).toContain('Insufficient')
    } finally {
      ;(creditService as any).validateCredits = originalValidate
    }
  })
})
