import React from "react"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { Provider } from "react-redux"
import { useRouter } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import configureStore from "redux-mock-store"
import CodeResultsPage from "./page"

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
    quizId: "test-code-quiz",
    slug: "test-code-quiz",
    results: null,
    questions: [],
    answers: {},
    status: "idle",
    error: null,
    title: "Test Code Quiz",
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

describe("Code Results Page", () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };
  
  const mockDispatch = jest.fn(() => Promise.resolve({ payload: {} }));
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mocks
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSession as jest.Mock).mockReturnValue({ status: "unauthenticated", data: null });
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.name === 'selectQuizResults') return mockSelectors.quizResults;
      if (selector.name === 'selectQuizStatus') return mockSelectors.quizStatus;
      if (selector.name === 'selectQuizError') return mockSelectors.quizError;
      if (selector.name === 'selectIsAuthenticated') return mockSelectors.isAuthenticated;
      if (selector.name === 'selectQuestions') return mockSelectors.questions;
      if (selector.name === 'selectAnswers') return mockSelectors.answers;
      if (selector.name === 'selectQuizTitle') return mockSelectors.quizTitle;
      if (selector.name === 'selectOrGenerateQuizResults') return mockSelectors.generatedResults;
      return null;
    });
  });

  it("shows loading state when auth is loading", () => {
    (useSession as jest.Mock).mockReturnValue({ status: "loading", data: null });
    
    render(<CodeResultsPage params={{ slug: "test-quiz" }} />);
    
    expect(screen.getByText("Checking authentication")).toBeInTheDocument();
  });
  
  // Update test for unauthenticated user flow
  it("shows sign-in prompt for unauthenticated users with no results", async () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectIsAuthenticated) return false;
      if (selector === selectQuizResults) return null;
      if (selector === selectOrGenerateQuizResults) return null;
      if (selector === selectAnswers) return {};
      return defaultMocks[selector] || null;
    });
    
    render(<CodeResultsPage params={{ slug: "react-hooks" }} />);
    
    // Should show sign-in prompt when no results are available
    expect(await screen.findByText("Sign In to View Results")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  // Add test for unauthenticated users with results
  it("shows results and sign-in option for unauthenticated users with results", async () => {
    const mockResults = {
      title: "React Hooks Quiz",
      score: 3,
      maxScore: 5,
      percentage: 60,
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
    
    render(<CodeResultsPage params={{ slug: "react-hooks" }} />);
    
    // Should show both results and sign-in option
    expect(await screen.findByText("React Hooks Quiz")).toBeInTheDocument();
    expect(screen.getByText("60% Score")).toBeInTheDocument();
    expect(screen.getByText("Save Your Results")).toBeInTheDocument();
  });
  
  it("shows sign-in prompt for unauthenticated users", async () => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.name === 'selectIsAuthenticated') return false;
      if (selector.name === 'selectAnswers') return {};
      return null;
    });
    
    render(<CodeResultsPage params={{ slug: "test-quiz" }} />);
    
    await waitFor(() => {
      expect(screen.getByText("Sign In to View Results")).toBeInTheDocument();
      expect(screen.getByText("Sign In")).toBeInTheDocument();
    });
  });
  
  it("shows results when authenticated with results available", async () => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.name === 'selectIsAuthenticated') return true;
      if (selector.name === 'selectQuizResults') return {
        title: "Test Quiz",
        score: 3,
        maxScore: 5,
        percentage: 60,
        questionResults: [],
      };
      return null;
    });
    
    render(<CodeResultsPage params={{ slug: "test-quiz" }} />);
    
    await waitFor(() => {
      expect(screen.getByText("Test Quiz")).toBeInTheDocument();
      expect(screen.getByText("60% Score")).toBeInTheDocument();
    });
  });
  
  it("shows error message when quiz status is failed", async () => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.name === 'selectIsAuthenticated') return true;
      if (selector.name === 'selectQuizStatus') return "failed";
      if (selector.name === 'selectQuizError') return "Failed to load quiz results";
      return null;
    });
    
    render(<CodeResultsPage params={{ slug: "test-quiz" }} />);
    
    await waitFor(() => {
      expect(screen.getByText("Unable to Load Results")).toBeInTheDocument();
    });
  });
});
