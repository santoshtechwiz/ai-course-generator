import { configureStore } from '@reduxjs/toolkit';
import subscriptionReducer, {
  clearSubscriptionData,
  resetState,
  setSubscriptionData,
  fetchSubscription,
  cancelSubscription,
  resumeSubscription,
  activateFreeTrial,
  selectSubscription,
  selectTokenUsage,
  selectIsSubscribed,
  selectSubscriptionPlan,
  type SubscriptionState,
  type SubscriptionData
} from './subscription-slice';
import type { RootState } from '..';

// Mock fetch globally
global.fetch = jest.fn() as jest.Mock;

// Create type-safe mock state for all slices needed in RootState
// Define minimal versions of other state types to satisfy type requirements
type MinimalAuthState = { user: null | any };
type MinimalQuizState = { quizId: null | string };
type MinimalFlashcardState = { cards: any[] };
type MinimalCourseState = { courses: any[] };
type MinimalCertificateState = { certificates: any[] };

// Create mock state creator with full type safety
const createMockRootState = (subscriptionState: Partial<SubscriptionState> = {}) => ({
  auth: { user: null } as MinimalAuthState,
  quiz: { quizId: null } as MinimalQuizState,
  flashcard: { cards: [] } as MinimalFlashcardState,
  course: { courses: [] } as MinimalCourseState, 
  certificate: { certificates: [] } as MinimalCertificateState,
  subscription: {
    data: null,
    isLoading: false,
    error: null,
    lastFetched: null,
    isFetching: false,
    ...subscriptionState
  }
});

// Mock logger to prevent console spam during tests
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

// Create a mock store for testing with proper RootState structure
const createMockStore = (initialState: Partial<SubscriptionState> = {}) => {
  return configureStore({
    reducer: {
      auth: (state = {}) => state,
      quiz: (state = {}) => state,
      flashcard: (state = {}) => state,
      course: (state = {}) => state,
      certificate: (state = {}) => state,
      subscription: subscriptionReducer
    },
    preloadedState: createMockRootState(initialState)
  });
};

describe('Subscription Slice', () => {
  afterEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  // Test initial state
  it('should return the initial state', () => {
    const initialState = subscriptionReducer(undefined, { type: 'unknown' });
    
    expect(initialState).toEqual({
      data: null,
      isLoading: false,
      error: null,
      lastFetched: null,
      isFetching: false
    });
  });

  // Test sync reducers
  describe('reducers', () => {
    it('should handle clearSubscriptionData', () => {
      const previousState: Partial<SubscriptionState> = {
        data: {
          credits: 100,
          tokensUsed: 50,
          isSubscribed: true,
          subscriptionPlan: 'PRO'
        } as SubscriptionData,
        lastFetched: 123456789
      };
      
      const newState = subscriptionReducer(previousState as SubscriptionState, clearSubscriptionData());
      
      expect(newState.data).toBeNull();
      expect(newState.lastFetched).toBeNull();
    });

    it('should handle resetState', () => {
      const previousState: Partial<SubscriptionState> = {
        data: {
          credits: 100,
          tokensUsed: 50,
          isSubscribed: true,
          subscriptionPlan: 'PRO'
        } as SubscriptionData,
        isLoading: true,
        error: 'Some error',
        lastFetched: 123456789
      };
      
      const newState = subscriptionReducer(previousState as SubscriptionState, resetState());
      
      expect(newState).toEqual({
        data: null,
        isLoading: false,
        error: null,
        lastFetched: null,
        isFetching: false
      });
    });

    it('should handle setSubscriptionData', () => {
      const previousState: SubscriptionState = {
        data: null,
        isLoading: true,
        error: 'Previous error',
        lastFetched: null,
        isFetching: true
      };
      
      const subscriptionData = {
        credits: 100,
        tokensUsed: 50,
        isSubscribed: true,
        subscriptionPlan: 'PRO'
      };
      
      const newState = subscriptionReducer(previousState, setSubscriptionData(subscriptionData));
      
      expect(newState.data).toEqual(subscriptionData);
      expect(newState.isLoading).toBe(false);
      expect(newState.error).toBeNull();
      expect(newState.lastFetched).toBeTruthy();
    });
  });

  // Test async thunks
  describe('async thunks', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      Date.now = jest.fn(() => 1617984000000); // Mock date for consistent tests
    });

    afterEach(() => {
      jest.useRealTimers();
    });    it('should handle fetchSubscription success', async () => {
      const mockSubscriptionData = {
        credits: 100,
        tokensUsed: 50,
        isSubscribed: true,
        subscriptionPlan: 'PRO',
        status: 'ACTIVE'
      };
      
      // Set up mock with Implementation to ensure it's used for this test
      (fetch as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockSubscriptionData),
          text: () => Promise.resolve(JSON.stringify(mockSubscriptionData))
        });
      });
      
      const store = createMockStore();
      const result = await store.dispatch(fetchSubscription());
      
      // Test the action directly
      expect(result.type).toContain('subscription/fetch/fulfilled');
      
      const state = store.getState().subscription;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastFetched).toBeTruthy();
    });

    it('should handle fetchSubscription with 401 unauthorized', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: jest.fn().mockResolvedValue('Unauthorized')
      });
      
      const store = createMockStore();
      await store.dispatch(fetchSubscription());
      
      const state = store.getState().subscription;
      expect(state.isLoading).toBe(false);
      // Should return default free data
      expect(state.data).toEqual({
        credits: 0,
        tokensUsed: 0,
        isSubscribed: false,
        subscriptionPlan: 'FREE',
        status: 'INACTIVE',
        cancelAtPeriodEnd: false      });
    });
    
    it('should handle fetchSubscription error', async () => {
      // Clear and set up a new mock for this specific test
      (fetch as jest.Mock).mockClear();
      (fetch as jest.Mock).mockImplementation(() => {
        return Promise.reject(new Error('Network error'));
      });
      
      const store = createMockStore();
      const result = await store.dispatch(fetchSubscription());
      
      // Test that the correct action type was returned
      expect(result.type).toContain('subscription/fetch/rejected');
      
      const state = store.getState().subscription;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should skip fetchSubscription if recently fetched', async () => {
      const existingData = {
        credits: 100,
        tokensUsed: 50,
        isSubscribed: true,
        subscriptionPlan: 'PRO'
      };
      
      const store = createMockStore({
        data: existingData as SubscriptionData,
        lastFetched: Date.now() - 5000 // 5 seconds ago
      });
      
      await store.dispatch(fetchSubscription());
      
      const state = store.getState().subscription;
      expect(state.data).toEqual(existingData);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle cancelSubscription success', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          canceled: true
        })
      });
      
      const store = createMockStore({
        data: {
          credits: 100,
          tokensUsed: 50,
          isSubscribed: true,
          subscriptionPlan: 'PRO',
          status: 'ACTIVE',
          cancelAtPeriodEnd: false
        } as SubscriptionData
      });
      
      await store.dispatch(cancelSubscription('Testing cancellation'));
      
      const state = store.getState().subscription;
      expect(state.data?.status).toBe('CANCELED');      expect(state.data?.cancelAtPeriodEnd).toBe(true);
    });
    
    it('should handle resumeSubscription success', async () => {
      // Reset all mocks for this test
      (fetch as jest.Mock).mockClear();
      (fetch as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            resumed: true,
            status: 'ACTIVE',
            cancelAtPeriodEnd: false
          })
        });
      });
      
      const store = createMockStore({
        data: {
          credits: 100,
          tokensUsed: 50,
          isSubscribed: true,
          subscriptionPlan: 'PRO',
          status: 'CANCELED',
          cancelAtPeriodEnd: true
        } as SubscriptionData
      });
      
      const result = await store.dispatch(resumeSubscription());
      
      // Test that the action was fulfilled
      expect(result.type).toContain('subscription/resume/fulfilled');
    });

    it('should handle activateFreeTrial success', async () => {
      // Reset all mocks for this test
      (fetch as jest.Mock).mockClear();
      (fetch as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            activated: true,
            credits: 5,
            subscriptionPlan: 'FREE_TRIAL'
          })
        });
      });
      
      const store = createMockStore({
        data: {
          credits: 0,
          tokensUsed: 0,
          isSubscribed: false,
          subscriptionPlan: 'FREE'
        } as SubscriptionData
      });
      
      const result = await store.dispatch(activateFreeTrial());
      
      // Test that the action was fulfilled
      expect(result.type).toContain('subscription/activateFreeTrial/fulfilled');
    });
  });
  // Test selectors
  describe('selectors', () => {
    const mockSubscriptionData: SubscriptionData = {
      credits: 100,
      tokensUsed: 40,
      isSubscribed: true,
      subscriptionPlan: 'PRO',
      status: 'ACTIVE',
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    };

    // Create a selector wrapper for easier testing with mock state
    const testSelector = <T>(selector: (state: any) => T, state: any): T => {
      return selector(state);
    };

    it('should select enhanced subscription data', () => {
      const store = createMockStore({ data: mockSubscriptionData });
      const state = store.getState();
      
      const subscription = testSelector(selectSubscription, state);
      
      expect(subscription).toEqual(expect.objectContaining({
        credits: 100,
        tokensUsed: 40,
        isSubscribed: true,
        subscriptionPlan: 'PRO',
        status: 'ACTIVE',
        isActive: true,
        isExpired: false,
        formattedCredits: '100 credits',
        hasCreditsRemaining: true
      }));
    });

    it('should select token usage data', () => {
      const store = createMockStore({ data: mockSubscriptionData });
      const state = store.getState();
      
      const tokenUsage = testSelector(selectTokenUsage, state);
      
      expect(tokenUsage).toEqual({
        tokensUsed: 40,
        total: 100,
        remaining: 60,
        percentage: 40,
        hasExceededLimit: false
      });
    });

    it('should handle token usage when exceeded', () => {
      const exceededData = { ...mockSubscriptionData, tokensUsed: 120 };
      const store = createMockStore({ data: exceededData });
      const state = store.getState();
      
      const tokenUsage = testSelector(selectTokenUsage, state);
      
      expect(tokenUsage).toEqual({
        tokensUsed: 120,
        total: 100,
        remaining: 0,
        percentage: 100, // Maxes out at 100%
        hasExceededLimit: true
      });
    });

    it('should select subscription status correctly', () => {
      const store = createMockStore({ data: mockSubscriptionData });
      const state = store.getState();
      
      expect(testSelector(selectIsSubscribed, state)).toBe(true);
      expect(testSelector(selectSubscriptionPlan, state)).toBe('PRO');
    });

    it('should handle null data in selectors', () => {
      const store = createMockStore({ data: null });
      const state = store.getState();
      
      expect(testSelector(selectSubscription, state)).toBeNull();
      expect(testSelector(selectTokenUsage, state)).toBeNull();
      expect(testSelector(selectIsSubscribed, state)).toBe(false);
      expect(testSelector(selectSubscriptionPlan, state)).toBe('FREE');
    });
  });
});
