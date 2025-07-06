/**
 * @jest-environment node
 */
import { describe, test, expect, beforeEach, afterEach, afterAll } from '@jest/globals'
import { SubscriptionService } from '../app/dashboard/subscription/services/subscription-service'
import type { SubscriptionPlanType, SubscriptionStatusType } from '../app/types/subscription'

// Mock the logger to avoid console output during tests
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}

// Mock Prisma for tests to avoid database dependency
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  userSubscription: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
  tokenTransaction: {
    findFirst: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
}

// Mock the modules
jest.mock('../lib/logger', () => ({
  logger: mockLogger
}))

jest.mock('../lib/db', () => ({
  prisma: mockPrisma
}))

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma)
}))

// Import Prisma after mocking
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

describe('Subscription Data Consistency', () => {
  const testUserId = 'test-user-123'
  const testEmail = 'test@example.com'
  
  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Mock the database operations
    mockPrisma.tokenTransaction.deleteMany.mockResolvedValue({ count: 0 })
    mockPrisma.userSubscription.deleteMany.mockResolvedValue({ count: 0 })
    mockPrisma.user.deleteMany.mockResolvedValue({ count: 0 })
    mockPrisma.user.create.mockResolvedValue({
      id: testUserId,
      email: testEmail,
      name: 'Test User',
      userType: 'FREE',
      credits: 0,
      creditsUsed: 0,
    })
  })

  afterEach(async () => {
    // Reset all mocks after each test
    jest.clearAllMocks()
  })

  afterAll(async () => {
    // Disconnect from Prisma after all tests are done
    await mockPrisma.$disconnect()
  })

  describe('getUserSubscriptionData', () => {
    test('should return consistent data for user without subscription', async () => {
      // Mock user without subscription
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        userType: 'FREE',
        credits: 0,
        creditsUsed: 0,
        subscription: null,
      })

      const result = await SubscriptionService.getUserSubscriptionData(testUserId)
      
      expect(result).toMatchObject({
        userId: testUserId,
        userType: 'FREE',
        credits: 0,
        creditsUsed: 0,
        subscription: null,
        isActive: false,
        isSubscribed: false,
      })
    })

    test('should return consistent data for user with active subscription', async () => {
      // Mock user with active subscription
      const currentPeriodEnd = new Date()
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
      
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        userType: 'PREMIUM',
        credits: 0,
        creditsUsed: 0,
        subscription: {
          id: 'sub-123',
          userId: testUserId,
          planId: 'PREMIUM',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd,
        },
      })

      const result = await SubscriptionService.getUserSubscriptionData(testUserId)
      
      expect(result).toMatchObject({
        userId: testUserId,
        userType: 'PREMIUM',
        credits: 0,
        subscription: expect.objectContaining({
          planId: 'PREMIUM',
          status: 'ACTIVE',
        }),
        isActive: true,
        isSubscribed: true,
      })
    })

    test('should return FREE for user with expired subscription', async () => {
      // Mock user with expired subscription
      const pastDate = new Date()
      pastDate.setMonth(pastDate.getMonth() - 1)
      
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        userType: 'FREE',
        credits: 0,
        creditsUsed: 0,
        subscription: {
          id: 'sub-123',
          userId: testUserId,
          planId: 'PREMIUM',
          status: 'ACTIVE',
          currentPeriodStart: new Date(pastDate.getTime() - 30 * 24 * 60 * 60 * 1000),
          currentPeriodEnd: pastDate,
        },
      })

      const result = await SubscriptionService.getUserSubscriptionData(testUserId)
      
      expect(result).toMatchObject({
        userId: testUserId,
        userType: 'FREE', // Should be FREE for expired subscription
        isActive: false,
        isSubscribed: false,
      })
    })
  })

  describe('updateUserSubscription', () => {
    test('should update subscription and user data consistently', async () => {
      const currentPeriodEnd = new Date()
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)

      // Mock the transaction operation
      mockPrisma.$transaction.mockImplementation(async (operations) => {
        // Execute the operations in the transaction
        return Promise.all(operations.map((op: any) => op))
      })

      // Mock the individual operations
      mockPrisma.user.update.mockResolvedValue({
        id: testUserId,
        userType: 'PREMIUM',
        credits: 250,
      })

      mockPrisma.userSubscription.upsert.mockResolvedValue({
        id: 'sub-123',
        userId: testUserId,
        planId: 'PREMIUM',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd,
      })

      mockPrisma.tokenTransaction.create.mockResolvedValue({
        id: 'tx-123',
        userId: testUserId,
        credits: 250,
        type: 'SUBSCRIPTION',
      })

      const result = await SubscriptionService.updateUserSubscription(
        testUserId,
        {
          planId: 'PREMIUM',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd,
        },
        250 // tokens to add
      )

      expect(result.success).toBe(true)
      expect(mockPrisma.$transaction).toHaveBeenCalled()
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userType: 'PREMIUM',
            credits: expect.objectContaining({
              increment: 250
            })
          })
        })
      )
    })

    test('should set userType to FREE when subscription is not active', async () => {
      // Mock the transaction operation
      mockPrisma.$transaction.mockImplementation(async (operations) => {
        return Promise.all(operations.map((op: any) => op))
      })

      mockPrisma.user.update.mockResolvedValue({
        id: testUserId,
        userType: 'FREE',
      })

      mockPrisma.userSubscription.upsert.mockResolvedValue({
        id: 'sub-123',
        userId: testUserId,
        planId: 'PREMIUM',
        status: 'CANCELED',
      })

      const result = await SubscriptionService.updateUserSubscription(
        testUserId,
        {
          planId: 'PREMIUM',
          status: 'CANCELED',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
        }
      )

      expect(result.success).toBe(true)
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userType: 'FREE'
          })
        })
      )
    })
  })

  describe('activateFreePlan', () => {
    test('should activate free plan and add tokens for new user', async () => {
      // Mock existing transaction check (no existing transaction)
      mockPrisma.tokenTransaction.findFirst.mockResolvedValue(null)

      // Mock the transaction operation
      mockPrisma.$transaction.mockImplementation(async (operations) => {
        return Promise.all(operations.map((op: any) => op))
      })

      mockPrisma.user.update.mockResolvedValue({
        id: testUserId,
        userType: 'FREE',
        credits: 5,
      })

      mockPrisma.userSubscription.upsert.mockResolvedValue({
        id: 'sub-free',
        userId: testUserId,
        planId: 'FREE',
        status: 'ACTIVE',
      })

      mockPrisma.tokenTransaction.create.mockResolvedValue({
        id: 'tx-free',
        userId: testUserId,
        credits: 5,
        type: 'FREE_SIGNUP',
      })

      const result = await SubscriptionService.activateFreePlan(testUserId)

      expect(result.success).toBe(true)
      expect(mockPrisma.tokenTransaction.findFirst).toHaveBeenCalled()
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    test('should not add tokens twice for same user', async () => {
      // Mock existing transaction (user already has free signup tokens)
      mockPrisma.tokenTransaction.findFirst.mockResolvedValue({
        id: 'existing-tx',
        userId: testUserId,
        credits: 5,
        type: 'FREE_SIGNUP',
      })

      mockPrisma.$transaction.mockImplementation(async (operations) => {
        return Promise.all(operations.map((op: any) => op))
      })

      mockPrisma.user.update.mockResolvedValue({
        id: testUserId,
        userType: 'FREE',
        credits: 5, // Should still be 5, not 10
      })

      mockPrisma.userSubscription.upsert.mockResolvedValue({
        id: 'sub-free',
        userId: testUserId,
        planId: 'FREE',
        status: 'ACTIVE',
      })

      const result = await SubscriptionService.activateFreePlan(testUserId)

      expect(result.success).toBe(true)
      expect(mockPrisma.tokenTransaction.create).not.toHaveBeenCalled() // Should not create new transaction
    })
  })

  describe('cancelUserSubscription', () => {
    test('should cancel subscription and set userType to FREE', async () => {
      // Mock the transaction operation
      mockPrisma.$transaction.mockImplementation(async (operations) => {
        return Promise.all(operations.map((op: any) => op))
      })

      mockPrisma.user.update.mockResolvedValue({
        id: testUserId,
        userType: 'FREE',
      })

      mockPrisma.userSubscription.update.mockResolvedValue({
        id: 'sub-123',
        userId: testUserId,
        planId: 'PREMIUM',
        status: 'CANCELED',
        cancelAtPeriodEnd: true,
      })

      const result = await SubscriptionService.cancelUserSubscription(testUserId)

      expect(result.success).toBe(true)
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userType: 'FREE'
          })
        })
      )
      expect(mockPrisma.userSubscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CANCELED',
            cancelAtPeriodEnd: true
          })
        })
      )
    })
  })

  describe('validateUserConsistency', () => {
    test('should detect inconsistent data', async () => {
      // Mock user with PREMIUM type but no subscription
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        userType: 'PREMIUM',
        credits: 0,
        creditsUsed: 0,
        subscription: null,
      })

      const result = await SubscriptionService.validateUserConsistency(testUserId)

      expect(result.isConsistent).toBe(false)
      expect(result.issues).toContain('User has no subscription but userType is "PREMIUM" instead of "FREE"')
    })

    test('should detect user type mismatch with active subscription', async () => {
      // Mock user with FREE type but active PREMIUM subscription
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        userType: 'FREE',
        credits: 0,
        creditsUsed: 0,
        subscription: {
          id: 'sub-123',
          userId: testUserId,
          planId: 'PREMIUM',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: futureDate,
        },
      })

      const result = await SubscriptionService.validateUserConsistency(testUserId)

      expect(result.isConsistent).toBe(false)
      expect(result.issues).toContain('User type "FREE" does not match active subscription plan "PREMIUM"')
    })

    test('should validate consistent data', async () => {
      // Mock user with consistent data
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: testUserId,
        userType: 'PREMIUM',
        credits: 0,
        creditsUsed: 0,
        subscription: {
          id: 'sub-123',
          userId: testUserId,
          planId: 'PREMIUM',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: futureDate,
        },
      })

      const result = await SubscriptionService.validateUserConsistency(testUserId)

      expect(result.isConsistent).toBe(true)
      expect(result.issues).toHaveLength(0)
    })
  })

  describe('fixUserConsistency', () => {
    test('should fix inconsistent user type', async () => {
      // Mock user with inconsistent data (FREE type but active PREMIUM subscription)
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: testUserId,
        userType: 'FREE',
        credits: 0,
        creditsUsed: 0,
        subscription: {
          id: 'sub-123',
          userId: testUserId,
          planId: 'PREMIUM',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: futureDate,
        },
      })

      mockPrisma.user.update.mockResolvedValue({
        id: testUserId,
        userType: 'PREMIUM',
      })

      // Mock validation after fix (should be consistent)
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: testUserId,
        userType: 'PREMIUM',
        credits: 0,
        creditsUsed: 0,
        subscription: {
          id: 'sub-123',
          userId: testUserId,
          planId: 'PREMIUM',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: futureDate,
        },
      })

      const result = await SubscriptionService.fixUserConsistency(testUserId)

      expect(result.success).toBe(true)
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userType: 'PREMIUM'
          })
        })
      )
    })

    test('should set user type to FREE when no active subscription', async () => {
      // Mock user with PREMIUM type but no subscription
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: testUserId,
        userType: 'PREMIUM',
        credits: 0,
        creditsUsed: 0,
        subscription: null,
      })

      mockPrisma.user.update.mockResolvedValue({
        id: testUserId,
        userType: 'FREE',
      })

      const result = await SubscriptionService.fixUserConsistency(testUserId)

      expect(result.success).toBe(true)
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userType: 'FREE'
          })
        })
      )
    })
  })

  describe('Data consistency across operations', () => {
    test('should maintain consistency through subscription lifecycle', async () => {
      // 1. Mock activateFreePlan
      mockPrisma.tokenTransaction.findFirst.mockResolvedValueOnce(null) // No existing free signup
      mockPrisma.$transaction.mockImplementation(async (operations) => {
        return Promise.all(operations.map((op: any) => op))
      })
      mockPrisma.user.update.mockResolvedValueOnce({
        id: testUserId,
        userType: 'FREE',
        credits: 5,
      })
      mockPrisma.userSubscription.upsert.mockResolvedValueOnce({
        id: 'sub-free',
        userId: testUserId,
        planId: 'FREE',
        status: 'ACTIVE',
      })
      mockPrisma.tokenTransaction.create.mockResolvedValueOnce({
        id: 'tx-free',
        userId: testUserId,
        credits: 5,
        type: 'FREE_SIGNUP',
      })
      // Mock validation after free plan (consistent)
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: testUserId,
        userType: 'FREE',
        credits: 5,
        creditsUsed: 0,
        subscription: {
          id: 'sub-free',
          userId: testUserId,
          planId: 'FREE',
          status: 'ACTIVE',
        },
      })

      await SubscriptionService.activateFreePlan(testUserId)
      let validation = await SubscriptionService.validateUserConsistency(testUserId)
      expect(validation.isConsistent).toBe(true)

      // 2. Mock upgrade to premium
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 1)
      
      mockPrisma.user.update.mockResolvedValueOnce({
        id: testUserId,
        userType: 'PREMIUM',
        credits: 255, // 5 + 250
      })
      mockPrisma.userSubscription.upsert.mockResolvedValueOnce({
        id: 'sub-premium',
        userId: testUserId,
        planId: 'PREMIUM',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: futureDate,
      })
      mockPrisma.tokenTransaction.create.mockResolvedValueOnce({
        id: 'tx-premium',
        userId: testUserId,
        credits: 250,
        type: 'SUBSCRIPTION',
      })
      // Mock validation after upgrade (consistent)
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: testUserId,
        userType: 'PREMIUM',
        credits: 255,
        creditsUsed: 0,
        subscription: {
          id: 'sub-premium',
          userId: testUserId,
          planId: 'PREMIUM',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: futureDate,
        },
      })

      await SubscriptionService.updateUserSubscription(
        testUserId,
        {
          planId: 'PREMIUM',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: futureDate,
        },
        250
      )

      validation = await SubscriptionService.validateUserConsistency(testUserId)
      expect(validation.isConsistent).toBe(true)

      // 3. Mock cancel subscription
      mockPrisma.user.update.mockResolvedValueOnce({
        id: testUserId,
        userType: 'FREE',
      })
      mockPrisma.userSubscription.update.mockResolvedValueOnce({
        id: 'sub-premium',
        userId: testUserId,
        planId: 'PREMIUM',
        status: 'CANCELED',
        cancelAtPeriodEnd: true,
      })
      // Mock validation after cancel (consistent)
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: testUserId,
        userType: 'FREE',
        credits: 255,
        creditsUsed: 0,
        subscription: {
          id: 'sub-premium',
          userId: testUserId,
          planId: 'PREMIUM',
          status: 'CANCELED',
          cancelAtPeriodEnd: true,
        },
      })

      await SubscriptionService.cancelUserSubscription(testUserId)

      validation = await SubscriptionService.validateUserConsistency(testUserId)
      expect(validation.isConsistent).toBe(true)

      // Verify all operations were called as expected
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2) // activateFreePlan and updateUserSubscription
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(3) // All three operations
    })
  })
})
