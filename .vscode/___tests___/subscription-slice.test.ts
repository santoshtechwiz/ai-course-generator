import { configureStore } from '@reduxjs/toolkit';
import subscriptionReducer, {
  fetchSubscription,
  cancelSubscription,
  resumeSubscription,
  activateFreeTrial,
  forceRefreshSubscription,
  clearSubscriptionData,
  resetState,
  setSubscriptionData,
  resetSubscriptionState,
  selectSubscriptionData,
  selectSubscriptionLoading,
  selectSubscriptionError,
  selectSubscription,
  selectTokenUsage,
  selectIsSubscribed,
  selectSubscriptionPlan,
  selectSubscriptionStatus,
  selectIsCancelled,
  type SubscriptionData,
  type SubscriptionState
} from '@/store/slices/subscription-slice';
import fetchMock from 'jest-fetch-mock';

// Mock the logger to avoid console output during tests
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('Subscription Slice', () => {
  // Set up fetch mock
  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterAll(() => {
    fetchMock.disableMocks();
  });

  // Test initial state
  it('should return the initial state', () => {
    const initialState = subscriptionReducer(undefined, { type: '' });
    expect(initialState).toEqual({
      data: null,
      isLoading: false,
      error: null,
      lastFetched: null,
      isFetching: false
    });
  });

  // Test synchronous actions
  describe('Synchronous actions', () => {
    it('should handle clearSubscriptionData', () => {
      const state = subscriptionReducer(
        {
          data: { credits: 100, tokensUsed: 50, isSubscribed: true, subscriptionPlan: 'PRO', status: 'ACTIVE' },
          isLoading: false,
          error: null,
          lastFetched: 1623456789000,
          isFetching: false
        },
        clearSubscriptionData()
      );
      
      expect(state.data).toBeNull();
      expect(state.lastFetched).toBeNull();
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
    });

    it('should handle resetState', () => {
      const state = subscriptionReducer(
        {
          data: { credits: 100, tokensUsed: 50, isSubscribed: true, subscriptionPlan: 'PRO', status: 'ACTIVE' },
          isLoading: true,
          error: 'Some error',
          lastFetched: 1623456789000,
          isFetching: true
        },
        resetState()
      );
      
      expect(state).toEqual({
        data: null,
        isLoading: false,
        error: null,
        lastFetched: null,
        isFetching: false
      });
    });

    it('should handle resetSubscriptionState', () => {
      const state = subscriptionReducer(
        {
          data: { credits: 100, tokensUsed: 50, isSubscribed: true, subscriptionPlan: 'PRO', status: 'ACTIVE' },
          isLoading: true,
          error: 'Some error',
          lastFetched: 1623456789000,
          isFetching: true
        },
        resetSubscriptionState()
      );
      
      expect(state).toEqual({
        data: null,
        isLoading: false,
        error: null,
        lastFetched: null,
        isFetching: false
      });
    });

    it('should handle setSubscriptionData', () => {
      const mockSubscriptionData = {
        credits: 200,
        tokensUsed: 75,
        isSubscribed: true,
        subscriptionPlan: 'PREMIUM',
        status: 'ACTIVE'
      };
      
      const state = subscriptionReducer(
        {
          data: null,
          isLoading: true,
          error: 'Some error',
          lastFetched: null,
          isFetching: true
        },
        setSubscriptionData(mockSubscriptionData)
      );
      
      expect(state.data).toEqual(mockSubscriptionData);
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
      expect(state.lastFetched).toBeTruthy();
      expect(state.isFetching).toBeFalsy();
    });
  });

  // Test async thunks with mock store
  describe('Async thunks', () => {
    let store: ReturnType<typeof configureStore>;
    
    beforeEach(() => {
      store = configureStore({
        reducer: {
          subscription: subscriptionReducer
        }
      });
    });

    it('should handle fetchSubscription.fulfilled', async () => {
      const mockSubscriptionData = {
        credits: 100,
        tokensUsed: 50,
        isSubscribed: true,
        subscriptionPlan: 'PRO',
        status: 'ACTIVE',
        cancelAtPeriodEnd: false
      };
      
      fetchMock.mockResponseOnce(JSON.stringify(mockSubscriptionData));
      
      await store.dispatch(fetchSubscription());
      
      const state = store.getState().subscription;
      expect(state.isLoading).toBeFalsy();
      expect(state.isFetching).toBeFalsy();
      expect(state.error).toBeNull();
      expect(state.data).toEqual(mockSubscriptionData);
      expect(state.lastFetched).toBeTruthy();
    });

    it('should handle fetchSubscription.rejected for network error', async () => {
      fetchMock.mockReject(new Error('Network connectivity issue'));
      
      await store.dispatch(fetchSubscription());
      
      const state = store.getState().subscription;
      expect(state.isLoading).toBeFalsy();
      expect(state.isFetching).toBeFalsy();
      expect(state.error).toContain('Network connectivity issue');
      // Should keep existing data if any
      expect(state.data).toEqual(null);
    });

    it('should handle fetchSubscription with unauthorized response', async () => {
      fetchMock.mockResponseOnce('Unauthorized', { status: 401 });
      
      await store.dispatch(fetchSubscription());
      
      const state = store.getState().subscription;
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
      // Should return default free subscription for 401
      expect(state.data).toEqual({
        credits: 0,
        tokensUsed: 0,
        isSubscribed: false,
        subscriptionPlan: 'FREE',
        status: 'INACTIVE',
        cancelAtPeriodEnd: false
      });
    });

    it('should handle cancelSubscription.fulfilled', async () => {
      // Set up initial state with subscription data
      store.dispatch(setSubscriptionData({
        credits: 100,
        tokensUsed: 50,
        isSubscribed: true,
        subscriptionPlan: 'PRO',
        status: 'ACTIVE',
        cancelAtPeriodEnd: false
      }));
      
      fetchMock.mockResponseOnce(JSON.stringify({ success: true }));
      
      await store.dispatch(cancelSubscription('Switching to another service'));
      
      const state = store.getState().subscription;
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
      expect(state.data?.status).toBe('CANCELED');
      expect(state.data?.cancelAtPeriodEnd).toBeTruthy();
    });

    it('should handle resumeSubscription.fulfilled', async () => {
      // Set up initial state with cancelled subscription
      store.dispatch(setSubscriptionData({
        credits: 100,
        tokensUsed: 50,
        isSubscribed: true,
        subscriptionPlan: 'PRO',
        status: 'CANCELED',
        cancelAtPeriodEnd: true
      }));
      
      fetchMock.mockResponseOnce(JSON.stringify({ success: true }));
      
      await store.dispatch(resumeSubscription());
      
      const state = store.getState().subscription;
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
      expect(state.data?.status).toBe('ACTIVE');
      expect(state.data?.cancelAtPeriodEnd).toBeFalsy();
    });

    it('should handle activateFreeTrial.fulfilled', async () => {
      // Set up initial state
      store.dispatch(setSubscriptionData({
        credits: 0,
        tokensUsed: 0,
        isSubscribed: false,
        subscriptionPlan: 'FREE',
        status: 'INACTIVE',
        cancelAtPeriodEnd: false
      }));
      
      fetchMock.mockResponseOnce(JSON.stringify({ success: true }));
      
      await store.dispatch(activateFreeTrial());
      
      const state = store.getState().subscription;
      expect(state.isLoading).toBeFalsy();
      expect(state.error).toBeNull();
      expect(state.data?.credits).toBe(5); // Should add 5 credits
    });

    it('should handle forceRefreshSubscription', async () => {
      // Mock navigator.onLine to return true
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      
      const mockSubscriptionData = {
        credits: 100,
        tokensUsed: 50,
        isSubscribed: true,
        subscriptionPlan: 'PRO',
        status: 'ACTIVE',
        cancelAtPeriodEnd: false
      };
      
      fetchMock.mockResponseOnce(JSON.stringify(mockSubscriptionData));
      
      await store.dispatch(forceRefreshSubscription());
      
      const state = store.getState().subscription;
      expect(state.data).toEqual(mockSubscriptionData);
      expect(state.lastFetched).toBeTruthy();
    });
    
    it('should handle forceRefreshSubscription with offline status', async () => {
      // Mock navigator.onLine to return false
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      
      const promise = store.dispatch(forceRefreshSubscription());
      
      await expect(promise).rejects.toThrow('Network connectivity issue');
      
      // Should not clear existing data
      const state = store.getState().subscription;
      expect(state.data).toEqual(null); // Initial state
    });
  });

  // Test selectors
  describe('Selectors', () => {
    let store: ReturnType<typeof configureStore>;
    const mockSubscriptionData: SubscriptionData = {
      credits: 100,
      tokensUsed: 75,
      isSubscribed: true,
      subscriptionPlan: 'PRO',
      status: 'ACTIVE',
      cancelAtPeriodEnd: false,
      expirationDate: '2025-12-31T23:59:59Z'
    };
    
    beforeEach(() => {
      store = configureStore({
        reducer: {
          subscription: subscriptionReducer
        }
      });
      
      // Set up test data
      store.dispatch(setSubscriptionData(mockSubscriptionData));
    });

    it('should select subscription data', () => {
      const state = store.getState();
      expect(selectSubscriptionData(state)).toEqual(mockSubscriptionData);
    });

    it('should select loading state', () => {
      const state = store.getState();
      expect(selectSubscriptionLoading(state)).toBeFalsy();
    });

    it('should select error state', () => {
      const state = store.getState();
      expect(selectSubscriptionError(state)).toBeNull();
    });

    it('should select formatted subscription data', () => {
      const state = store.getState();
      const formattedData = selectSubscription(state);
      
      expect(formattedData).toEqual({
        ...mockSubscriptionData,
        isActive: true,
        isExpired: false,
        formattedCredits: '100 credits',
        hasCreditsRemaining: true
      });
    });

    it('should select token usage data', () => {
      const state = store.getState();
      const tokenUsage = selectTokenUsage(state);
      
      expect(tokenUsage).toEqual({
        tokensUsed: 75,
        total: 100,
        remaining: 25,
        percentage: 75,
        hasExceededLimit: false
      });
    });

    it('should select token usage with exceeded limit', () => {
      // Update the state with token usage exceeding credits
      store.dispatch(setSubscriptionData({
        ...mockSubscriptionData,
        tokensUsed: 150 // More than credits
      }));
      
      const state = store.getState();
      const tokenUsage = selectTokenUsage(state);
      
      expect(tokenUsage.hasExceededLimit).toBeTruthy();
      expect(tokenUsage.remaining).toBe(0); // Should not go negative
      expect(tokenUsage.percentage).toBe(100); // Should cap at 100%
    });

    it('should select subscription status booleans', () => {
      const state = store.getState();
      
      expect(selectIsSubscribed(state)).toBeTruthy();
      expect(selectSubscriptionPlan(state)).toBe('PRO');
      expect(selectSubscriptionStatus(state)).toBe('ACTIVE');
      expect(selectIsCancelled(state)).toBeFalsy();
    });

    it('should handle cancelled subscription', () => {
      // Update with cancelled subscription
      store.dispatch(setSubscriptionData({
        ...mockSubscriptionData,
        cancelAtPeriodEnd: true
      }));
      
      const state = store.getState();
      expect(selectIsCancelled(state)).toBeTruthy();
      
      const formattedData = selectSubscription(state);
      expect(formattedData.isActive).toBeTruthy(); // Still active until period ends
    });

    it('should handle expired subscription', () => {
      // Update with expired subscription
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday
      
      store.dispatch(setSubscriptionData({
        ...mockSubscriptionData,
        status: 'EXPIRED',
        expirationDate: pastDate.toISOString()
      }));
      
      const state = store.getState();
      const formattedData = selectSubscription(state);
      expect(formattedData.isExpired).toBeTruthy();
    });

    it('should handle null subscription data', () => {
      store.dispatch(clearSubscriptionData());
      
      const state = store.getState();
      expect(selectSubscription(state)).toBeNull();
      expect(selectIsSubscribed(state)).toBeFalsy();
      expect(selectSubscriptionPlan(state)).toBe('FREE');
      expect(selectTokenUsage(state)).toBeNull();
    });
  });

  // Test de-duplication behavior for frequent calls
  describe('Debounce behavior', () => {
    let store: ReturnType<typeof configureStore>;
    let realDateNow: () => number;
    
    beforeEach(() => {
      store = configureStore({
        reducer: {
          subscription: subscriptionReducer
        }
      });
      
      // Mock Date.now for controlled testing of throttling
      realDateNow = Date.now;
      Date.now = jest.fn(() => 1623456789000); // Fixed timestamp
    });
    
    afterEach(() => {
      Date.now = realDateNow; // Restore original Date.now
    });

    it('should debounce rapidly successive fetch calls', async () => {
      const mockSubscriptionData = {
        credits: 100,
        tokensUsed: 50,
        isSubscribed: true,
        subscriptionPlan: 'PRO'
      };
      
      fetchMock.mockResponseOnce(JSON.stringify(mockSubscriptionData));
      
      // First call should fetch
      await store.dispatch(fetchSubscription());
      expect(fetchMock.mock.calls.length).toBe(1);
      
      // Second call within throttle window should use cached data
      await store.dispatch(fetchSubscription());
      expect(fetchMock.mock.calls.length).toBe(1); // No additional fetch
      
      // Simulate time passing beyond throttle window
      Date.now = jest.fn(() => 1623456789000 + 20000); // 20 seconds later
      
      fetchMock.mockResponseOnce(JSON.stringify(mockSubscriptionData));
      
      // Now it should fetch again
      await store.dispatch(fetchSubscription());
      expect(fetchMock.mock.calls.length).toBe(2);
    });

    it('should always fetch with forceRefreshSubscription regardless of timing', async () => {
      const mockSubscriptionData = {
        credits: 100,
        tokensUsed: 50,
        isSubscribed: true,
        subscriptionPlan: 'PRO'
      };
      
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      
      fetchMock.mockResponseOnce(JSON.stringify(mockSubscriptionData));
      await store.dispatch(fetchSubscription());
      
      // Even immediately after, forceRefresh should trigger a new fetch
      fetchMock.mockResponseOnce(JSON.stringify(mockSubscriptionData));
      await store.dispatch(forceRefreshSubscription());
      
      expect(fetchMock.mock.calls.length).toBe(2);
    });
  });

  // Test error handling
  describe('Error handling', () => {
    let store: ReturnType<typeof configureStore>;
    
    beforeEach(() => {
      store = configureStore({
        reducer: {
          subscription: subscriptionReducer
        }
      });
    });

    it('should format network errors properly', async () => {
      fetchMock.mockReject(new Error('Failed to fetch'));
      
      await store.dispatch(fetchSubscription());
      
      const state = store.getState().subscription;
      expect(state.error).toContain('Network connectivity issue');
    });

    it('should format timeout errors properly', async () => {
      fetchMock.mockReject(new Error('timeout'));
      
      await store.dispatch(fetchSubscription());
      
      const state = store.getState().subscription;
      expect(state.error).toContain('Network connectivity issue');
    });

    it('should handle server errors with status codes', async () => {
      fetchMock.mockResponseOnce('Internal Server Error', { status: 500 });
      
      await store.dispatch(fetchSubscription());
      
      const state = store.getState().subscription;
      expect(state.error).toContain('Error 500');
    });

    it('should handle subscription action errors', async () => {
      fetchMock.mockReject(new Error('Subscription action failed'));
      
      await store.dispatch(cancelSubscription('test reason'));
      
      const state = store.getState().subscription;
      expect(state.error).toBe('Subscription action failed');
      expect(state.isLoading).toBeFalsy();
    });
  });
});