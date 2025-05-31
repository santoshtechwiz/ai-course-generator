import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { configureStore } from "@reduxjs/toolkit";
import BlanksResultsPage from "./page";
import { useSessionService } from "@/hooks/useSessionService";
import quizReducer from "@/store/slices/quizSlice";
import authReducer from "@/store/slices/authSlice";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn((param) => param === "fromAuth" ? "false" : null),
  })),
}));

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}));

// Mock useSessionService hook
jest.mock("@/hooks/useSessionService", () => ({
  useSessionService: jest.fn(),
}));

// Mock React's use function for handling params
jest.mock("react", () => {
  const originalReact = jest.requireActual("react");
  return {
    ...originalReact,
    use: jest.fn((promise) => {
      if (promise && typeof promise === "object" && "slug" in promise) {
        return promise;
      }
      return promise;
    }),
  };
});

// Create a mock store with the necessary state
const createStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      quiz: quizReducer,
      auth: authReducer,
    },
    preloadedState: initialState,
  });
};

describe("BlanksResultsPage", () => {
  // Common test setup
  const mockParams = { slug: "test-quiz" };
  const mockRouter = { push: jest.fn() };
  const mockDispatch = jest.fn();
  const mockSearchParams = { get: jest.fn() };
  
  const mockSessionService = {
    saveAuthRedirectState: jest.fn(),
    restoreAuthRedirectState: jest.fn(),
    clearQuizResults: jest.fn(),
  };
  
  const mockQuizResults = {
    slug: "test-quiz",
    title: "Test Blanks Quiz",
    score: 3,
    maxScore: 5,
    percentage: 60,
    completedAt: Date.now(),
    questions: [
      {
        id: "q1",
        text: "Complete the sentence: The sky is ___.",
        correctAnswers: ["blue"],
      },
      {
        id: "q2",
        text: "Fill in: Water boils at ___ degrees Celsius.",
        correctAnswers: ["100"],
      },
    ],
    questionResults: [
      {
        questionId: "q1",
        userAnswer: "blue",
        correctAnswer: "blue",
        isCorrect: true,
      },
      {
        questionId: "q2",
        userAnswer: "90",
        correctAnswer: "100",
        isCorrect: false,
      },
    ],
  };

  const mockAnswers = {
    q1: { questionId: "q1", userAnswer: "blue", isCorrect: true },
    q2: { questionId: "q2", userAnswer: "90", isCorrect: false },
  };

  const mockQuestions = [
    {
      id: "q1",
      text: "Complete the sentence: The sky is ___.",
      correctAnswers: ["blue"],
    },
    {
      id: "q2",
      text: "Fill in: Water boils at ___ degrees Celsius.",
      correctAnswers: ["100"],
    },
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up default mocks
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (useSessionService as jest.Mock).mockReturnValue(mockSessionService);
    mockSearchParams.get.mockReturnValue(null);

    // Setup default Redux state
    (useSelector as jest.Mock).mockImplementation((selector) => {
      // Mock different selector functions
      if (selector.name === "selectQuizResults") return null;
      if (selector.name === "selectQuizStatus") return "idle";
      if (selector.name === "selectQuizError") return null;
      if (selector.name === "selectIsAuthenticated") return true;
      if (selector.name === "selectQuestions") return mockQuestions;
      if (selector.name === "selectAnswers") return mockAnswers;
      if (selector.name === "selectQuizTitle") return "Test Blanks Quiz";
      if (selector.name === "selectOrGenerateQuizResults") return mockQuizResults;
      return null;
    });

    // Set up session mock
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { name: "Test User" } },
      status: "authenticated",
    });

    // Mock window.sessionStorage
    Object.defineProperty(window, "sessionStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  // Test: Loading state is displayed while authentication is loading
  it("shows loading state when authentication is loading", async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "loading",
    });

    render(<BlanksResultsPage params={mockParams} />);
    expect(screen.getByText("Checking authentication")).toBeInTheDocument();
  });

  // Test: Redirect to quiz when no results exist
  it("redirects to quiz when no results or answers exist", async () => {
    // Mock empty answers and no results
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.name === "selectQuizResults") return null;
      if (selector.name === "selectOrGenerateQuizResults") return null;
      if (selector.name === "selectAnswers") return {};
      return null;
    });

    render(<BlanksResultsPage params={mockParams} />);
    
    // Should show the loading message
    expect(screen.getByText("No Results Available")).toBeInTheDocument();
    
    // Should redirect to quiz page
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/blanks/test-quiz");
    });
  });

  // Test: Unauthenticated user sees limited results
  it("shows limited results for unauthenticated user", async () => {
    // Mock unauthenticated state
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.name === "selectIsAuthenticated") return false;
      if (selector.name === "selectQuizResults") return mockQuizResults;
      if (selector.name === "selectOrGenerateQuizResults") return mockQuizResults;
      return null;
    });

    render(<BlanksResultsPage params={mockParams} />);
    
    // Should show limited results
    expect(screen.getByText(/Your Score: 60%/i)).toBeInTheDocument();
    expect(screen.getByText("Sign In to See Full Results")).toBeInTheDocument();
    expect(screen.getByText("Why Sign In?")).toBeInTheDocument();
  });

  // Test: Authenticated user sees full results
  it("shows full results for authenticated user", async () => {
    render(<BlanksResultsPage params={mockParams} />);
    
    // Should render BlankQuizResults component
    // This is a bit limited as we're not fully rendering the child component
    // But we can check for the container at least
    expect(screen.getByRole("article", { name: /quiz results/i })).toBeInTheDocument();
  });

  // Test: Sign-in handler is called when user clicks sign in
  it("calls sign in when user clicks sign in button", async () => {
    const user = userEvent.setup();
    
    // Mock unauthenticated state
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.name === "selectIsAuthenticated") return false;
      if (selector.name === "selectQuizResults") return mockQuizResults;
      return null;
    });

    render(<BlanksResultsPage params={mockParams} />);
    
    // Click sign in button
    await user.click(screen.getByRole("button", { name: /Sign In to See Full Results/i }));
    
    // Should call saveAuthRedirectState and signIn
    expect(mockSessionService.saveAuthRedirectState).toHaveBeenCalled();
    expect(signIn).toHaveBeenCalled();
  });

  // Test: Retake button clears quiz state and redirects
  it("clears quiz state and redirects when retake is clicked", async () => {
    const user = userEvent.setup();
    
    render(<BlanksResultsPage params={mockParams} />);
    
    // Find and click retake button - may be inside BlankQuizResults
    const retakeButton = screen.getByRole("button", { name: /Retake Quiz/i });
    await user.click(retakeButton);
    
    // Should clear quiz results and redirect
    expect(mockSessionService.clearQuizResults).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/blanks/test-quiz?reset=true");
  });

  // Test: Auth restoration happens after login
  it("restores auth state when user returns after authentication", () => {
    // Mock search params to indicate returning from auth
    mockSearchParams.get.mockReturnValue("true");
    
    render(<BlanksResultsPage params={mockParams} />);
    
    // Should try to restore auth redirect state
    expect(mockSessionService.restoreAuthRedirectState).toHaveBeenCalled();
  });

  // Test: Results are automatically generated if not present but answers exist
  it("generates results if not present but answers exist", () => {
    // Mock scenario where we have answers but no explicit results
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.name === "selectQuizResults") return null;
      if (selector.name === "selectOrGenerateQuizResults") return null;
      if (selector.name === "selectAnswers") return mockAnswers;
      if (selector.name === "selectQuestions") return mockQuestions;
      return null;
    });

    render(<BlanksResultsPage params={mockParams} />);
    
    // Should create results from answers
    expect(screen.getByRole("article", { name: /quiz results/i })).toBeInTheDocument();
  });
});
