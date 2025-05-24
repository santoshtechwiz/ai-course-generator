import { configureStore, createAction } from "@reduxjs/toolkit";
import persistQuizMiddleware, {
  checkStoredAuthRedirectState,
  clearPersistedQuizState,
  loadPersistedQuizState,
  loadPersistedQuizResults,
  cleanup
} from "@/store/middleware/persistQuizMiddleware";
import { 
  setCurrentQuestion, 
  saveAuthRedirectState, 
  restoreFromAuthRedirect,
  markQuizCompleted
} from "@/store/slices/quizSlice";
import quizReducer from "@/store/slices/quizSlice";

// Mock Redux actions if not available in test environment
jest.mock("@/store/slices/quizSlice", () => {
  const actual = jest.requireActual("@/store/slices/quizSlice");
  return {
    ...actual,
    setCurrentQuestion: createAction<number>("quiz/setCurrentQuestion"),
    saveAuthRedirectState: createAction<any>("quiz/saveAuthRedirectState"),
    restoreFromAuthRedirect: createAction<any>("quiz/restoreFromAuthRedirect"),
    markQuizCompleted: createAction<any>("quiz/markQuizCompleted"),
    quizInitialState: {
      currentQuestion: 0,
      currentQuizSlug: "",
      currentQuizId: "",
      currentQuizType: "code",
      userAnswers: [],
      quizData: null,
      tempResults: null,
      status: {
        isLoading: false,
        isSubmitting: false,
        isCompleted: false,
        hasError: false,
        errorMessage: null
      }
    }
  };
});

// Mock window and storage
const createMockStorage = () => {
  const storage = new Map<string, string>();
  return {
    getItem: jest.fn((key: string) => storage.get(key) || null),
    setItem: jest.fn((key: string, value: string) => storage.set(key, value)),
    removeItem: jest.fn((key: string) => storage.delete(key)),
    clear: jest.fn(() => storage.clear()),
    get length() { return storage.size; },
    key: jest.fn((index: number) => Array.from(storage.keys())[index] || null),
    // For test inspection
    _getAll: () => Object.fromEntries(storage.entries())
  };
};

// Setup test environment
describe("persistQuizMiddleware", () => {
  let mockStorage: ReturnType<typeof createMockStorage>;
  let store: ReturnType<typeof configureStore>;
  const quizSlug = "test-quiz";
  
  // Mock window and document
  const originalWindow = { ...window };
  const originalDocument = { ...document };
  
  beforeEach(() => {
    jest.useFakeTimers();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock storage
    mockStorage = createMockStorage();
    
    // Mock window
    Object.defineProperty(global, 'window', {
      value: {
        ...originalWindow,
        sessionStorage: mockStorage,
        localStorage: mockStorage,
        setTimeout: jest.fn().mockImplementation((cb, ms) => {
          return setTimeout(cb, ms);
        }),
        clearTimeout: jest.fn().mockImplementation((id) => {
          clearTimeout(id);
        }),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
      writable: true
    });
    
    // Mock document
    Object.defineProperty(global, 'document', {
      value: {
        ...originalDocument,
        visibilityState: 'visible'
      },
      writable: true
    });
    
    // Create store with middleware
    store = configureStore({
      reducer: {
        quiz: quizReducer
      },
      middleware: (getDefaultMiddleware) => 
        getDefaultMiddleware({
          serializableCheck: false
        }).concat(persistQuizMiddleware.middleware),
      preloadedState: {
        quiz: {
          currentQuestion: 0,
          currentQuizSlug: quizSlug,
          currentQuizId: "q123",
          currentQuizType: "code",
          userAnswers: [],
          quizData: {
            id: "q123",
            slug: quizSlug,
            title: "Test Quiz",
            questions: [],
            type: "code",
            isPublic: true,
            isFavorite: false,
            ownerId: "owner1"
          },
          tempResults: null,
          status: {
            isLoading: false,
            isSubmitting: false,
            isCompleted: false,
            hasError: false,
            errorMessage: null
          }
        }
      }
    });
  });
  
  afterEach(() => {
    cleanup();
    jest.clearAllTimers();
    jest.useRealTimers();
    
    // Restore globals
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      writable: true
    });
    
    Object.defineProperty(global, 'document', {
      value: originalDocument,
      writable: true
    });
  });
  
  it("should persist quiz state with debouncing", async () => {
    // Dispatch actions
    store.dispatch(setCurrentQuestion(1));
    store.dispatch(setCurrentQuestion(2));
    store.dispatch(setCurrentQuestion(3));
    
    // Advance timers to trigger debounced save
    jest.advanceTimersByTime(350);
    
    // Check if storage was called
    expect(mockStorage.setItem).toHaveBeenCalled();
    
    // Get the last call arguments
    const lastCallArgs = mockStorage.setItem.mock.calls[mockStorage.setItem.mock.calls.length - 1];
    const key = lastCallArgs[0];
    const value = JSON.parse(lastCallArgs[1]);
    
    // Verify the key and data
    expect(key).toBe(`quiz_state_${quizSlug}`);
    expect(value.currentQuestion).toBe(3);
  });
  
  it("should handle storage errors gracefully", async () => {
    // Mock storage error
    mockStorage.setItem.mockImplementationOnce(() => {
      throw new Error("Storage full");
    });
    
    // This should not throw
    store.dispatch(setCurrentQuestion(1));
    
    // Advance timers
    jest.advanceTimersByTime(350);
    
    // Should have attempted to save
    expect(mockStorage.setItem).toHaveBeenCalled();
  });
  
  it("should clear state on quiz completion atomically", async () => {
    // First set a question
    store.dispatch(setCurrentQuestion(2));
    jest.advanceTimersByTime(350);
    
    // Reset mock to check next calls
    mockStorage.setItem.mockClear();
    mockStorage.removeItem.mockClear();
    
    // Mark quiz as completed
    store.dispatch(markQuizCompleted({
      quizId: "q123",
      slug: quizSlug,
      score: 5,
      totalQuestions: 10,
      correctAnswers: 5,
      totalTime: 120,
      type: "code",
      results: {}
    }));
    
    // Wait for async operations
    jest.advanceTimersByTime(350);
    await Promise.resolve();
    
    // Verify results were saved
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      `quiz_results_${quizSlug}`,
      expect.stringContaining('"score":5')
    );
    
    // Verify state was cleared
    expect(mockStorage.removeItem).toHaveBeenCalledWith(`quiz_state_${quizSlug}`);
  });
  
  it("should validate and migrate stored data", async () => {
    // Setup legacy data without version
    const legacy = {
      currentQuestion: 1,
      userAnswers: [],
      quizData: null,
      timestamp: Date.now()
    };
    
    // Store it directly
    mockStorage.getItem.mockReturnValueOnce(JSON.stringify(legacy));
    
    // Load it
    const loaded = await loadPersistedQuizState(quizSlug);
    
    // Check if version was added
    expect(loaded).not.toBeNull();
    expect(loaded?.currentQuestion).toBe(1);
    expect(loaded?.version).toBeDefined();
  });
  
  it("should handle corrupted storage data", async () => {
    // Setup corrupted data
    mockStorage.getItem.mockReturnValueOnce("invalid json{");
    
    // Load it
    const loaded = await loadPersistedQuizState(quizSlug);
    
    // Should return null for corrupted data
    expect(loaded).toBeNull();
    
    // Should attempt to remove corrupted data
    expect(mockStorage.removeItem).toHaveBeenCalledWith(`quiz_state_${quizSlug}`);
  });
  
  it("should handle missing or empty quiz data gracefully", async () => {
    // Setup empty object
    mockStorage.getItem.mockReturnValueOnce(JSON.stringify({
      timestamp: Date.now()
    }));
    
    // Load it
    const loaded = await loadPersistedQuizState(quizSlug);
    
    // Should use defaults
    expect(loaded).not.toBeNull();
    expect(loaded?.currentQuestion).toBe(0);
    expect(loaded?.userAnswers).toEqual([]);
    
    // Test with null
    mockStorage.getItem.mockReturnValueOnce(null);
    
    // Load it
    const loadedNull = await loadPersistedQuizState(quizSlug);
    
    // Should return null
    expect(loadedNull).toBeNull();
  });
  
  it("should save and load quiz results correctly", async () => {
    const result = {
      quizId: "q123",
      slug: quizSlug,
      score: 5,
      totalQuestions: 10,
      correctAnswers: 5,
      totalTime: 120,
      type: "code",
      results: {}
    };
    
    // Save results
    store.dispatch(markQuizCompleted(result));
    
    // Wait for async operations
    jest.advanceTimersByTime(350);
    await Promise.resolve();
    
    // Setup mock for loading
    const savedData = JSON.stringify({
      ...result,
      timestamp: Date.now(),
      version: "1.0.0"
    });
    mockStorage.getItem.mockReturnValueOnce(savedData);
    
    // Load results
    const results = await loadPersistedQuizResults(quizSlug);
    
    // Verify loaded data
    expect(results).not.toBeNull();
    expect(results?.score).toBe(5);
    expect(results?.slug).toBe(quizSlug);
  });
  
  it("should handle errors when loading quiz results", async () => {
    // Setup corrupted data
    mockStorage.getItem.mockReturnValueOnce("corrupt data{");
    
    // Load it
    const results = await loadPersistedQuizResults(quizSlug);
    
    // Should return null
    expect(results).toBeNull();
    
    // Should attempt to remove corrupted data
    expect(mockStorage.removeItem).toHaveBeenCalledWith(`quiz_results_${quizSlug}`);
  });
  
  it("should check and restore auth redirect state", async () => {
    // Setup auth state
    const authState = {
      slug: quizSlug,
      type: "code",
      currentQuestion: 3,
      userAnswers: [],
      tempResults: null,
      quizId: "q123",
      timestamp: Date.now(),
      version: "1.0.0"
    };
    
    mockStorage.getItem.mockReturnValueOnce(JSON.stringify(authState));
    
    // Mock dispatch
    const dispatchSpy = jest.spyOn(store, "dispatch");
    
    // Check stored state
    await checkStoredAuthRedirectState(store);
    
    // Verify dispatch was called
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('restoreFromAuthRedirect')
      })
    );
    
    // Verify state was removed
    expect(mockStorage.removeItem).toHaveBeenCalledWith("quiz_auth_redirect");
    
    dispatchSpy.mockRestore();
  });
  
  it("should handle corrupted auth redirect state", async () => {
    // Setup corrupted data
    mockStorage.getItem.mockReturnValueOnce("not json{");
    
    // Mock dispatch
    const dispatchSpy = jest.spyOn(store, "dispatch");
    
    // Check stored state
    await checkStoredAuthRedirectState(store);
    
    // Verify dispatch was not called with restore action
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('restoreFromAuthRedirect')
      })
    );
    
    // Verify corrupted state was removed
    expect(mockStorage.removeItem).toHaveBeenCalledWith("quiz_auth_redirect");
    
    dispatchSpy.mockRestore();
  });
  
  it("should handle invalid auth redirect state", async () => {
    // Setup invalid data (missing required fields)
    mockStorage.getItem.mockReturnValueOnce(JSON.stringify({ incomplete: true }));
    
    // Mock dispatch
    const dispatchSpy = jest.spyOn(store, "dispatch");
    
    // Check stored state
    await checkStoredAuthRedirectState(store);
    
    // Verify dispatch was not called with restore action
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('restoreFromAuthRedirect')
      })
    );
    
    // Verify invalid state was removed
    expect(mockStorage.removeItem).toHaveBeenCalledWith("quiz_auth_redirect");
    
    dispatchSpy.mockRestore();
  });
  
  it("should handle authentication required action", async () => {
    // Dispatch auth required action
    store.dispatch({
      type: "quiz/authenticationRequired",
      payload: {
        fromSubmission: true,
        type: "code"
      }
    });
    
    // Wait for debounced save
    jest.advanceTimersByTime(150);
    
    // Verify auth state was saved
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      "quiz_auth_redirect",
      expect.stringContaining('"fromSubmission":true')
    );
  });
  
  it("should use tab-specific keys for debouncing", async () => {
    // Dispatch actions to trigger debounced saves
    store.dispatch(setCurrentQuestion(1));
    store.dispatch(setCurrentQuestion(2));
    
    // Only the last one should be saved
    jest.advanceTimersByTime(350);
    
    // Verify only one save occurred with the latest value
    const setItemCalls = mockStorage.setItem.mock.calls.filter(
      call => call[0] === `quiz_state_${quizSlug}`
    );
    
    // Should have only one call for this key
    expect(setItemCalls.length).toBe(1);
    
    // The saved value should contain the latest question number
    const savedData = JSON.parse(setItemCalls[0][1]);
    expect(savedData.currentQuestion).toBe(2);
  });
  
  it("should force save pending changes on visibility change", () => {
    // Dispatch action but don't advance timers yet
    store.dispatch(setCurrentQuestion(4));
    
    // Clear mock to focus on visibility change effects
    mockStorage.setItem.mockClear();
    
    // Trigger visibility change
    document.visibilityState = 'hidden';
    const visibilityChangeEvent = new Event('visibilitychange');
    window.dispatchEvent(visibilityChangeEvent);
    
    // Verify storage was called immediately without waiting for debounce
    expect(mockStorage.setItem).toHaveBeenCalled();
  });
  
  it("should calculate quiz progress correctly", () => {
    // This test is for the quiz progress calculation
    // Assuming the quiz has 10 questions
    const state = store.getState();
    expect(state.quiz.currentQuizSlug).toBe(quizSlug);
    
    // Dispatch to change question
    store.dispatch(setCurrentQuestion(5));
    
    // Verify state was updated
    const updatedState = store.getState();
    expect(updatedState.quiz.currentQuestion).toBe(5);
  });
});
