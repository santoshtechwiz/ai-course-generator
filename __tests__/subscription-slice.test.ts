import { describe, it, expect, vi, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import { subscriptionSlice, fetchSubscription, forceSyncSubscription, selectTokenUsage, selectHasActiveSubscription } from '@/store/slices/subscription-slice'
import { SubscriptionData } from '@/types/subscription'

// Mock fetchWithTimeout function
global.fetch = vi.fn()
const fetchWithTimeoutMock = vi.fn()

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

describe('Subscription Slice', () => {
  let store: ReturnType<typeof setupStore>

  function setupStore(preloadedState = {}) {
    return configureStore({
      reducer: {
        subscription: subscriptionSlice.reducer
      },
      preloadedState
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    store = setupStore()

    // Reset fetch mock
    vi.spyOn(global, 'fetch').mockImplementation(() => {
      throw new Error('fetch should not be called directly')
    })
  })

  describe('Initial State', () => {
    it('should have the correct initial state', () => {
      const state = store.getState().subscription
      expect(state).toEqual({
        currentSubscription: null,
        isLoading: false,
        isFetching: false,
        error: null,
        lastSync: 0,
        cacheStatus: 'empty'
      })
    })
  })

  describe('Reducers', () => {
    it('should handle resetSubscriptionState', () => {
      // Set some state first
      store.dispatch(subscriptionSlice.actions.setSubscriptionData({
        id: 'sub_123',
        userId: 'user_123',
        subscriptionId: 'sub_123',
        credits: 10,
        tokensUsed: 2,
        isSubscribed: true,
        subscriptionPlan: 'PREMIUM',
        status: 'ACTIVE',
        expirationDate: '2025-12-31T23:59:59.999Z',
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          source: "test",
          timestamp: new Date().toISOString()
        }
      }))

      // Then reset it
      store.dispatch(subscriptionSlice.actions.resetSubscriptionState())

      // Check state is reset
      const state = store.getState().subscription
      expect(state).toEqual({
        currentSubscription: null,
        isLoading: false,
        isFetching: false,
        error: null,
        lastSync: 0,
        cacheStatus: 'empty'
      })
    })

    it('should handle setSubscriptionData', () => {
      const mockData: SubscriptionData = {
        id: 'sub_123',
        userId: 'user_123',
        subscriptionId: 'sub_123',
        credits: 10,
        tokensUsed: 2,
        isSubscribed: true,
        subscriptionPlan: 'PREMIUM',
        status: 'ACTIVE',
        expirationDate: '2025-12-31T23:59:59.999Z',
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          source: "test",
          timestamp: new Date().toISOString()
        }
      }

      store.dispatch(subscriptionSlice.actions.setSubscriptionData(mockData))

      const state = store.getState().subscription
      expect(state.currentSubscription).toEqual(mockData)
      expect(state.lastSync).toBeGreaterThan(0)
    })

    it('should handle clearSubscriptionError', () => {
      // Set error state first
      store = setupStore({
        subscription: {
          currentSubscription: null,
          isLoading: false,
          isFetching: false,
          error: 'Test error',
          lastSync: 0,
          cacheStatus: 'error'
        }
      })

      store.dispatch(subscriptionSlice.actions.clearSubscriptionError())

      const state = store.getState().subscription
      expect(state.error).toBeNull()
    })
  })

  describe('Async Thunks', () => {
    it('should handle fetchSubscription.pending', () => {
      // Using unwrap to trigger the pending state without resolving
      store.dispatch(fetchSubscription() as any)

      const state = store.getState().subscription
      expect(state.isFetching).toBe(true)
      expect(state.error).toBeNull()
    })

    it('should handle forceSyncSubscription.pending', () => {
      // Using unwrap to trigger the pending state without resolving
      store.dispatch(forceSyncSubscription() as any)

      const state = store.getState().subscription
      expect(state.isLoading).toBe(true)
      expect(state.isFetching).toBe(true)
      expect(state.error).toBeNull()
    })

    // More comprehensive async tests would require mocking the fetch implementation
    // and testing the fulfilled/rejected cases
  })

  describe('Selectors', () => {
    beforeEach(() => {
      store = setupStore({
        subscription: {
          currentSubscription: {
            id: 'test',
            userId: 'user-123',
            credits: 100,
            tokensUsed: 25,
            isSubscribed: true,
            subscriptionPlan: 'PREMIUM',
            status: 'ACTIVE',
            expirationDate: '2025-12-31T23:59:59.999Z',
            cancelAtPeriodEnd: false,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z'
          },
          isLoading: false,
          isFetching: false,
          error: null,
          lastSync: Date.now(),
          cacheStatus: 'fresh'
        }
      })
    })

    it('should calculate token usage correctly', () => {
      const state = store.getState()
      const usage = selectTokenUsage(state)
      expect(usage).toEqual({
        used: 25,
        total: 100,
        tokensUsed: 25,
        remaining: 75,
        percentage: 25, // 25%
        hasExceededLimit: false
      })
    })

    it('should detect active subscription correctly', () => {
      const state = store.getState()
      const isActive = selectHasActiveSubscription(state)
      expect(isActive).toBe(true)
    })
  })
})