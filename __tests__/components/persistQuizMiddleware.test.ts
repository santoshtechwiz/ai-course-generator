import { configureStore } from "@reduxjs/toolkit"
import quizReducer, { setCurrentQuestion, submitQuiz } from "@/store/slices/quizSlice"
import persistQuizMiddleware, {
  loadPersistedQuizState,
  clearPersistedQuizState,
} from "@/store/middleware/persistQuizMiddleware"

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Set up localStorage mock before tests
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true
});

// Create direct mock function for requestIdleCallback
const mockRequestIdleCallbackFn = jest.fn((callback) => {
  callback({ timeRemaining: () => 50 });
  return 123; // return a number as the ID
});

// Directly attach the mock to window
Object.defineProperty(window, 'requestIdleCallback', {
  value: mockRequestIdleCallbackFn,
  writable: true,
  configurable: true
});

describe("persistQuizMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    mockRequestIdleCallbackFn.mockClear();
  });

  test("should persist quiz state when actions are dispatched", async () => {
    // Create store with middleware
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware().concat(persistQuizMiddleware.middleware);
      },
    });

    // Set up initial quiz state
    await store.dispatch({
      type: "quiz/fetchQuiz/fulfilled",
      payload: {
        id: "test-quiz",
        title: "Test Quiz",
        type: "mcq",
        slug: "test-quiz",
        questions: [
          { id: "q1", question: "Question 1", type: "mcq" }
        ],
      },
    });

    // Force middleware to run
    store.dispatch(setCurrentQuestion(0));
    
    // Check if localStorage.setItem was called directly
    // Skip requestIdleCallback since it's not reliable in test environment
    expect(localStorageMock.setItem).toHaveBeenCalled();
    expect(localStorageMock.setItem).toHaveBeenCalledWith("quiz_state", expect.any(String));

    // Parse the saved data to verify content
    const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(savedData.currentQuestion).toBe(0);
    expect(savedData.currentQuizId).toBe("test-quiz");
  });

  test("should remove quiz state from localStorage when quiz is completed", async () => {
    // Create store with middleware
    const store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware().concat(persistQuizMiddleware.middleware);
      },
    });

    // Set up quiz data
    await store.dispatch({
      type: "quiz/fetchQuiz/fulfilled",
      payload: {
        id: "test-quiz",
        title: "Test Quiz",
        slug: "test-quiz",
        questions: [{ id: "q1" }]
      },
    });

    // Complete the quiz - should trigger removal
    await store.dispatch({
      type: "quiz/submitQuiz/fulfilled",
      payload: {
        quizId: "test-quiz",
        score: 10,
        maxScore: 10,
      },
    });

    // Check if localStorage.removeItem was called - directly testing the effect
    expect(localStorageMock.removeItem).toHaveBeenCalled();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("quiz_state");
  });

  test("loadPersistedQuizState should return persisted state", () => {
    const mockState = {
      currentQuestion: 1,
      userAnswers: [{ questionId: "q1", answer: "A" }],
      currentQuizId: "test-quiz",
    }

    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockState))

    const result = loadPersistedQuizState()
    expect(result).toEqual(mockState)
  })

  test("clearPersistedQuizState should remove state from localStorage", () => {
    clearPersistedQuizState()
    expect(localStorageMock.removeItem).toHaveBeenCalled()
  })
})
