import React from "react"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { Provider } from "react-redux"
import { useRouter } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import configureStore from "redux-mock-store"
import McqResultsPage from "./page"

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn((param) => param === 'auth' ? null : null)
  })),
}))

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}))

// Mock React's use function for handling params
jest.mock("react", () => {
  const originalReact = jest.requireActual("react");
  return {
    ...originalReact,
    use: jest.fn((promise) => {
      if (promise && typeof promise === 'object' && 'slug' in promise) {
        return promise;
      }
      return promise;
    }),
  };
});

// Create mock store
const mockStore = configureStore([])

// Create default state to avoid null selector issues
const createDefaultState = (overrides = {}) => ({
  quiz: {
    quizId: "test-quiz",
    slug: "test-quiz",
    results: null,
    questions: [],
    answers: {},
    status: "idle",
    error: null,
    title: "Test Quiz",
    ...overrides.quiz || {}
  },
  auth: {
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
    ...overrides.auth || {}
  }
})

// Mock store utils to ensure results are properly retrieved
jest.mock("@/store/utils/session", () => ({
  getQuizResults: jest.fn().mockImplementation(() => null),
  saveQuizResults: jest.fn(),
}))

// Mock thunks to return plain objects so redux-mock-store doesn't throw
jest.mock('@/store/slices/quizSlice', () => {
  const actual = jest.requireActual('@/store/slices/quizSlice');
  return {
    ...actual,
    checkAuthAndLoadResults: jest.fn(() => ({ type: 'quiz/checkAuthAndLoadResults', payload: {} })),
    rehydrateQuiz: jest.fn((payload) => ({ type: 'quiz/rehydrateQuiz', payload })),
    resetPendingQuiz: jest.fn(() => ({ type: 'quiz/resetPendingQuiz' })),
    setQuizResults: jest.fn((payload) => ({ type: 'quiz/setQuizResults', payload })),
  };
});

describe("MCQ Results Page", () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };
  
  const mockDispatch = jest.fn(() => Promise.resolve({ payload: {} }));
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock router
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock dispatch
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    
    // Mock sessionStorage
    const mockSessionStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    });
  })

  // Update test for unauthenticated user flow
  it("shows sign-in prompt for unauthenticated users with no results", async () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectIsAuthenticated) return false;
      if (selector === selectQuizResults) return null;
      if (selector === selectOrGenerateQuizResults) return null;
      if (selector === selectAnswers) return {};
      return defaultMocks[selector] || null;
    });
    
    render(<McqResultsPage params={{ slug: "javascript-basics" }} />);
    
    // Should show sign-in prompt when no results are available
    expect(await screen.findByText("Sign In to View Results")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  // Add test for unauthenticated users with results
  it("shows results and sign-in option for unauthenticated users with results", async () => {
    const mockResults = {
      title: "JavaScript Basics",
      score: 7,
      maxScore: 10,
      percentage: 70,
      questionResults: [
        { questionId: "1", isCorrect: true },
        { questionId: "2", isCorrect: false },
      ],
      questions: [{ id: "1", text: "Question 1" }, { id: "2", text: "Question 2" }]
    };
    
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectIsAuthenticated) return false;
      if (selector === selectQuizResults) return null;
      if (selector === selectOrGenerateQuizResults) return mockResults;
      if (selector === selectAnswers) return { 1: {}, 2: {} };
      return defaultMocks[selector] || null;
    });
    
    render(<McqResultsPage params={{ slug: "javascript-basics" }} />);
    
    // Should show both results and sign-in option
    expect(await screen.findByText("JavaScript Basics")).toBeInTheDocument();
    expect(screen.getByText("70% Score")).toBeInTheDocument();
    expect(screen.getByText("Save Your Results")).toBeInTheDocument();
  });
  
  it("shows sign-in prompt for unauthenticated users", async () => {
    // Mock unauthenticated session
    (useSession as jest.Mock).mockReturnValue({ 
      data: null, 
      status: "unauthenticated" 
    })
    
    const store = mockStore(createDefaultState({
      auth: {
        isAuthenticated: false,
      }
    }))
    
    render(
      <Provider store={store}>
        <McqResultsPage params={{ slug: "test-quiz" }} />
      </Provider>
    )
    
    await waitFor(() => {
      expect(screen.getByText("Sign In to View Results")).toBeInTheDocument()
      expect(screen.getByText(/Please sign in to view your quiz results/i)).toBeInTheDocument()
    })
    
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(signInButton);
    expect(signIn).toHaveBeenCalled()
  })

  it("shows results when authenticated with results available", async () => {
    (useSession as jest.Mock).mockReturnValue({ 
      data: { user: { name: "Test User" } }, 
      status: "authenticated" 
    })
    
    const store = mockStore(createDefaultState({
      auth: {
        isAuthenticated: true,
        user: { name: "Test User" },
      },
      quiz: {
        status: "succeeded",
        results: { 
          score: 2, 
          maxScore: 3, 
          percentage: 67, 
          slug: "test-quiz", 
          title: "Test Quiz", 
          completedAt: new Date().toISOString(),
          questions: [{ id: "1", question: "Q1", options: ["A", "B"], correctOptionId: "A" }],
          questionResults: [{ questionId: "1", isCorrect: true, userAnswer: "A" }],
          answers: [{ questionId: "1", selectedOptionId: "A", isCorrect: true }],
        },
      }
    }))
    
    render(
      <Provider store={store}>
        <McqResultsPage params={{ slug: "test-quiz" }} />
      </Provider>
    )
    
    await waitFor(() => {
      expect(screen.getByText(/2 out of 3/i)).toBeInTheDocument()
      expect(screen.getByText("67%")).toBeInTheDocument()
    })
  })

  it("shows loading state when auth is loading", async () => {
    (useSession as jest.Mock).mockReturnValue({ 
      data: null, 
      status: "loading" 
    })
    
    const store = mockStore(createDefaultState({
      quiz: {
        status: "loading",
      }
    }))
    
    render(
      <Provider store={store}>
        <McqResultsPage params={{ slug: "test-quiz" }} />
      </Provider>
    )
    
    await waitFor(() => {
      expect(screen.getByText(/Checking authentication/i)).toBeInTheDocument()
    })
  })

  it("shows error message when quiz status is failed", async () => {
    (useSession as jest.Mock).mockReturnValue({ 
      data: { user: { name: "Test User" } }, 
      status: "authenticated" 
    })
    
    const store = mockStore(createDefaultState({
      auth: {
        isAuthenticated: true,
      },
      quiz: {
        status: "failed",
        error: "Failed to load quiz results"
      }
    }))
    
    render(
      <Provider store={store}>
        <McqResultsPage params={{ slug: "test-quiz" }} />
      </Provider>
    )
    
    await waitFor(() => {
      expect(screen.getByText(/Error Loading Results/i)).toBeInTheDocument()
      expect(screen.getByText(/Failed to load quiz results/i)).toBeInTheDocument()
    })
  })

  it("handles the special case of 'Results not found' error by generating results", async () => {
    (useSession as jest.Mock).mockReturnValue({ 
      data: { user: { name: "Test User" } }, 
      status: "authenticated" 
    })
    
    const pendingQuizData = {
      slug: "test-quiz",
      quizData: {
        title: "Test Quiz",
        questions: [{ id: "1", question: "Q1", options: ["A", "B"], correctOptionId: "A" }]
      },
      currentState: {
        showResults: true
      }
    };
    
    const store = mockStore(createDefaultState({
      auth: {
        isAuthenticated: true,
      },
      quiz: {
        status: "failed",
        error: "Results not found. Please take the quiz again.",
        pendingQuiz: pendingQuizData
      }
    }))
    
    render(
      <Provider store={store}>
        <McqResultsPage params={{ slug: "test-quiz" }} />
      </Provider>
    )
    
    await waitFor(() => {
      expect(screen.getByText(/Generating quiz results/i)).toBeInTheDocument()
    })
    
    const actions = store.getActions();
    expect(actions.some(action => 
      action.type === 'quiz/rehydrateQuiz' && 
      action.payload.currentState.showResults === true
    )).toBeTruthy();
  })

  it("redirects to quiz page when no results and no answers on authenticated state", async () => {
    // Mock router
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    // Mock authenticated session
    (useSession as jest.Mock).mockReturnValue({ 
      data: { user: { name: "Test User" } }, 
      status: "authenticated" 
    })
    
    // Create store with authenticated state but no questions or answers
    const store = mockStore(createDefaultState({
      auth: {
        isAuthenticated: true,
      },
      quiz: {
        status: "succeeded",
        questions: [],
        answers: {},
      }
    }))
    
    // Use fake timers for setTimeout
    jest.useFakeTimers();
    
    render(
      <Provider store={store}>
        <McqResultsPage params={{ slug: "test-quiz" }} />
      </Provider>
    )
    
    // Fast-forward timers
    jest.advanceTimersByTime(500);
    
    // Expect redirect to happen
    expect(mockPush).toHaveBeenCalledWith("/dashboard/mcq/test-quiz");
    
    // Restore timers
    jest.useRealTimers();
  })

  it("handles recovery from pendingQuiz with showResults=true", async () => {
    (useSession as jest.Mock).mockReturnValue({ 
      data: { user: { name: "Test User" } }, 
      status: "authenticated" 
    })
    
    const pendingQuizData = {
      slug: "test-quiz",
      quizData: {
        title: "Test Quiz",
        questions: [{ id: "1", question: "Q1", options: ["A", "B"], correctOptionId: "A" }]
      },
      currentState: {
        showResults: true,
        // No pre-populated results
      }
    };
    
    // Mock sessionStorage to return pending quiz
    window.sessionStorage.getItem = jest.fn().mockImplementation((key) => {
      if (key === 'pendingQuiz') return JSON.stringify(pendingQuizData);
      return null;
    });
    
    const store = mockStore(createDefaultState({
      auth: {
        isAuthenticated: true,
      },
      quiz: {
        status: "idle",
        pendingQuiz: pendingQuizData,
      }
    }))
    
    render(
      <Provider store={store}>
        <McqResultsPage params={{ slug: "test-quiz" }} />
      </Provider>
    )
    
    // Should dispatch rehydrateQuiz with the pending quiz data
    await waitFor(() => {
      const actions = store.getActions();
      expect(actions.some(action => action.type === 'quiz/rehydrateQuiz')).toBeTruthy();
    });
  })

  it("handles numeric IDs in the URL by redirecting to proper slug", async () => {
    // Use a numeric slug to trigger the slug redirection
    const numericSlug = "123";
    
    // Mock the router
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    // Mock authenticated session
    (useSession as jest.Mock).mockReturnValue({ 
      data: { user: { name: "Test User" } }, 
      status: "authenticated" 
    })
    
    // Mock pendingQuiz with a proper slug in sessionStorage
    const pendingQuizWithProperSlug = {
      slug: "proper-slug-name",
      quizData: { title: "Test Quiz" }
    };
    
    // Mock sessionStorage to return pendingQuiz with proper slug
    window.sessionStorage.getItem = jest.fn().mockImplementation((key) => {
      if (key === 'pendingQuiz') return JSON.stringify(pendingQuizWithProperSlug);
      return null;
    });
    
    const store = mockStore(createDefaultState({
      auth: {
        isAuthenticated: true,
      },
      quiz: {
        status: "idle",
        pendingQuiz: pendingQuizWithProperSlug,
      }
    }));
    
    // Use fake timers
    jest.useFakeTimers();
    
    render(
      <Provider store={store}>
        <McqResultsPage params={{ slug: numericSlug }} />
      </Provider>
    );
    
    // Fast-forward timers
    jest.advanceTimersByTime(500);
    
    // Should redirect to the proper slug
    expect(mockPush).toHaveBeenCalledWith("/dashboard/mcq/proper-slug-name");
    
    // Restore timers
    jest.useRealTimers();
  });

  it("properly handles slug values when fetching results", async () => {
    // Mock authenticated session
    (useSession as jest.Mock).mockReturnValue({ 
      data: { user: { name: "Test User" } }, 
      status: "authenticated" 
    });
    
    // Setup mock implementation for getItem BEFORE creating the store
    const mockGetItem = jest.fn();
    window.sessionStorage.getItem = mockGetItem;
    
    // Setup specific mock implementation for the quiz_results key
    mockGetItem.mockImplementation((key) => {
      if (key === 'quiz_results_angular-advanced-UvGH3X') {
        return JSON.stringify({
          score: 5,
          maxScore: 10,
          percentage: 50,
          slug: "angular-advanced-UvGH3X",
          title: "Angular Advanced",
          completedAt: new Date().toISOString(),
          questions: [],
          questionResults: []
        });
      }
      return null;
    });
    
    // Create a store with quiz data
    const store = mockStore(createDefaultState({
      auth: {
        isAuthenticated: true,
      },
      quiz: {
        status: "succeeded",
        slug: "angular-advanced-UvGH3X", // String slug only
        questions: [
          { id: "1", question: "Q1", options: ["A", "B"], correctOptionId: "A" }
        ],
        answers: {
          "1": { questionId: "1", selectedOptionId: "A", isCorrect: true }
        }
      }
    }));
    
    render(
      <Provider store={store}>
        <McqResultsPage params={{ slug: "angular-advanced-UvGH3X" }} />
      </Provider>
    );
    
    // The component should compute results on the spot with available questions/answers
    await waitFor(() => {
      expect(screen.getByText(/1 out of 1/i)).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
    });
    
    // First, ensure getItem was called
    expect(mockGetItem).toHaveBeenCalled();
    
    // Then specifically check for our expected key
    expect(mockGetItem).toHaveBeenCalledWith('quiz_results_angular-advanced-UvGH3X');
  });

  // it("handles numeric slugs by treating them as strings", async () => {
  //   const numericSlug = "38";
    
  //   // Mock authenticated session
  //   (useSession as jest.Mock).mockReturnValue({ 
  //     data: { user: { name: "Test User" } }, 
  //     status: "authenticated" 
  //   });
    
  //   // Set up Redux store with numeric slug
  //   const store = mockStore(createDefaultState({
  //     auth: {
  //       isAuthenticated: true,
  //     },
  //     quiz: {
  //       slug: numericSlug,
  //       status: "succeeded",
  //       questions: [
  //         { id: "1", question: "What is Angular Ivy?", options: ["A", "B", "C", "D"], correctOptionId: "C" }
  //       ],
  //       answers: {
  //         "1": { questionId: "1", selectedOptionId: "C", isCorrect: true }
  //       },
  //       pendingQuiz: {
  //         slug: numericSlug,
  //         quizData: {
  //           title: "Angular Advanced",
  //           questions: [{ id: "1", question: "What is Angular Ivy?", options: ["A", "B", "C", "D"], correctOptionId: "C" }]
  //         },
  //         currentState: {
  //           showResults: true
  //         }
  //       }
  //     }
  //   }));
    
  //   // Mock saveQuizResults to capture what's being saved
  //   const { saveQuizResults } = require("@/store/utils/session");
    
  //   render(
  //     <Provider store={store}>
  //       <McqResultsPage params={{ slug: numericSlug }} />
  //     </Provider>
  //   );
    
  //   // Verify rendered content shows computed results
  //   await waitFor(() => {
  //     expect(screen.getByText(/1 out of 1/i)).toBeInTheDocument();
  //     expect(screen.getByText("100%")).toBeInTheDocument();
  //   });
    
  //   // Verify the quiz was saved with the numeric slug as a string
  //   const actions = store.getActions();
  //   const setResultsAction = actions.find(action => action.type === 'quiz/setQuizResults');
    
  //   // Ensure we're using the slug as the primary identifier
  //   if (setResultsAction) {
  //     expect(setResultsAction.payload.slug).toBe(numericSlug);
  //     expect(saveQuizResults).toHaveBeenCalledWith(numericSlug, expect.objectContaining({
  //       slug: numericSlug
  //     }));
  //   }
  // });
})
