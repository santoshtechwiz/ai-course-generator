import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { configureStore } from "@reduxjs/toolkit";
import OpenEndedResultsPage from "./page";
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

describe("OpenEndedResultsPage", () => {
  // Setup common mocks and utilities
  const mockRouter = { push: jest.fn() };
  const mockClearQuizResults = jest.fn();
  const mockRestoreAuthRedirectState = jest.fn();
  const mockSaveAuthRedirectState = jest.fn();
  
  beforeEach(() => {
    jest.resetAllMocks();
    
    // Default mock implementations
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSession as jest.Mock).mockReturnValue({
      status: "unauthenticated",
      data: null,
    });
    (useSessionService as jest.Mock).mockReturnValue({
      clearQuizResults: mockClearQuizResults,
      restoreAuthRedirectState: mockRestoreAuthRedirectState,
      saveAuthRedirectState: mockSaveAuthRedirectState,
    });
    
    // Mock session storage
    const mockSessionStorage = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, "sessionStorage", {
      value: mockSessionStorage,
    });
  });

  // Test: Loading state is displayed while authentication is loading
  it("shows loading state when authentication is loading", () => {
    (useSession as jest.Mock).mockReturnValue({
      status: "loading",
      data: null,
    });
    
    const initialState = {
      quiz: {
        status: "idle",
        questions: [],
        answers: {},
        results: null,
      },
      auth: {
        isAuthenticated: false,
      },
    };
    
    const store = createStore(initialState);
    
    render(
      <Provider store={store}>
        <OpenEndedResultsPage params={{ slug: "test-slug" }} />
      </Provider>
    );
    
    expect(screen.getByText("Checking authentication")).toBeInTheDocument();
  });
  
  // Test: Redirect to quiz when no results exist
  it("redirects to quiz when no results or answers exist", async () => {
    const initialState = {
      quiz: {
        status: "succeeded",
        questions: [],
        answers: {},
        results: null,
      },
      auth: {
        isAuthenticated: false,
      },
    };
    
    const store = createStore(initialState);
    
    render(
      <Provider store={store}>
        <OpenEndedResultsPage params={{ slug: "test-slug" }} />
      </Provider>
    );
    
    // Should show loading screen with redirect message
    expect(screen.getByText("No Results Available")).toBeInTheDocument();
    
    // Wait for the redirect timeout
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/openended/test-slug");
    }, { timeout: 1500 });
  });
  
  // Test: Unauthenticated user sees limited results
  it("shows limited results for unauthenticated user", () => {
    const initialState = {
      quiz: {
        status: "succeeded",
        questions: [
          { id: "1", text: "Question 1", modelAnswer: "Model answer 1" },
          { id: "2", text: "Question 2", modelAnswer: "Model answer 2" },
        ],
        answers: {
          "1": { text: "User answer 1", type: "openended" },
          "2": { text: "User answer 2", type: "openended" },
        },
        title: "Open-Ended Quiz",
        results: {
          slug: "test-slug",
          title: "Open-Ended Quiz",
          score: 2,
          maxScore: 2,
          percentage: 100,
          questionResults: [
            { questionId: "1", isCorrect: true, userAnswer: "User answer 1", correctAnswer: "Model answer 1", feedback: "Good job!" },
            { questionId: "2", isCorrect: true, userAnswer: "User answer 2", correctAnswer: "Model answer 2", feedback: "Well done!" },
          ],
        },
      },
      auth: {
        isAuthenticated: false,
      },
    };
    
    const store = createStore(initialState);
    
    render(
      <Provider store={store}>
        <OpenEndedResultsPage params={{ slug: "test-slug" }} />
      </Provider>
    );
    
    // Should show completion rate and sign-in prompt but not detailed results/feedback
    expect(screen.getByText("Your Completion Rate: 100%")).toBeInTheDocument();
    expect(screen.getByText("Sign In to See Full Results")).toBeInTheDocument();
    expect(screen.getByText("Why Sign In?")).toBeInTheDocument();
    // Should not show feedback
    expect(screen.queryByText("Good job!")).not.toBeInTheDocument();
  });
  
  // Test: Authenticated user sees full results
  it("shows full results for authenticated user", () => {
    const initialState = {
      quiz: {
        status: "succeeded",
        questions: [
          { id: "1", text: "Question 1", modelAnswer: "Model answer 1" },
          { id: "2", text: "Question 2", modelAnswer: "Model answer 2" },
        ],
        answers: {
          "1": { text: "User answer 1", type: "openended" },
          "2": { text: "User answer 2", type: "openended" },
        },
        title: "Open-Ended Quiz",
        results: {
          slug: "test-slug",
          title: "Open-Ended Quiz",
          score: 2,
          maxScore: 2,
          percentage: 100,
          questionResults: [
            { questionId: "1", isCorrect: true, userAnswer: "User answer 1", correctAnswer: "Model answer 1", feedback: "Good job!" },
            { questionId: "2", isCorrect: true, userAnswer: "User answer 2", correctAnswer: "Model answer 2", feedback: "Well done!" },
          ],
        },
      },
      auth: {
        isAuthenticated: true,
      },
    };
    
    const store = createStore(initialState);
    
    (useSession as jest.Mock).mockReturnValue({
      status: "authenticated",
      data: { user: { name: "Test User" } },
    });
    
    render(
      <Provider store={store}>
        <OpenEndedResultsPage params={{ slug: "test-slug" }} />
      </Provider>
    );
    
    // Look for Score text instead of title to avoid brittleness
    expect(screen.getByText(/score/i, { selector: ".text-xl.text-muted-foreground" })).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
  
  // Test: Sign-in handler is called when user clicks sign in
  it("calls sign in when user clicks sign in button", async () => {
    const initialState = {
      quiz: {
        status: "succeeded",
        questions: [{ id: "1", text: "Question 1", modelAnswer: "Model answer" }],
        answers: { "1": { text: "User answer", type: "openended" } },
        title: "Open-Ended Quiz",
        results: {
          score: 1,
          maxScore: 1,
          percentage: 100,
          questionResults: [
            { questionId: "1", isCorrect: true, userAnswer: "User answer", correctAnswer: "Model answer", feedback: "Good job!" },
          ],
        },
      },
      auth: {
        isAuthenticated: false,
      },
    };
    
    const store = createStore(initialState);
    
    render(
      <Provider store={store}>
        <OpenEndedResultsPage params={{ slug: "test-slug" }} />
      </Provider>
    );
    
    // Click sign in button
    fireEvent.click(screen.getByText("Sign In to See Full Results"));
    
    // Verify saveAuthRedirectState and signIn were called
    await waitFor(() => {
      expect(mockSaveAuthRedirectState).toHaveBeenCalled();
      expect(signIn).toHaveBeenCalled();
    });
  });
  
  // Test: Retake button clears quiz state and redirects
  it("clears quiz state and redirects when retake is clicked", () => {
    const initialState = {
      quiz: {
        status: "succeeded",
        questions: [{ id: "1", text: "Question 1", modelAnswer: "Model answer" }],
        answers: { "1": { text: "User answer", type: "openended" } },
        title: "Open-Ended Quiz",
        results: {
          score: 1,
          maxScore: 1,
          percentage: 100,
        },
      },
      auth: {
        isAuthenticated: true,
      },
    };
    
    const store = createStore(initialState);
    
    (useSession as jest.Mock).mockReturnValue({
      status: "authenticated",
      data: { user: { name: "Test User" } },
    });
    
    render(
      <Provider store={store}>
        <OpenEndedResultsPage params={{ slug: "test-slug" }} />
      </Provider>
    );
    
    // Find and click the retake button
    const retakeButton = screen.getByRole("button", { name: /retake quiz/i });
    fireEvent.click(retakeButton);
    
    // Verify clearQuizResults was called and router.push was called with the right URL
    expect(mockClearQuizResults).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/openended/test-slug?reset=true");
  });
  
  // Test: Auth restoration happens after login
  it("restores auth state when user returns after authentication", () => {
    // Mock fromAuth parameter
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((param) => param === "fromAuth" ? "true" : null),
    });
    
    (useSession as jest.Mock).mockReturnValue({
      status: "authenticated",
      data: { user: { name: "Test User" } },
    });
    
    const initialState = {
      quiz: {
        status: "succeeded",
        questions: [],
        answers: {},
        results: null,
      },
      auth: {
        isAuthenticated: true,
      },
    };
    
    const store = createStore(initialState);
    
    render(
      <Provider store={store}>
        <OpenEndedResultsPage params={{ slug: "test-slug" }} />
      </Provider>
    );
    
    // Verify restoreAuthRedirectState was called
    expect(mockRestoreAuthRedirectState).toHaveBeenCalled();
  });
  
  // Test: Results are automatically generated if not present but answers exist
  it("generates results if not present but answers exist", () => {
    const initialState = {
      quiz: {
        status: "succeeded",
        questions: [
          { id: "1", text: "Question 1", modelAnswer: "Model answer 1" },
          { id: "2", text: "Question 2", modelAnswer: "Model answer 2" },
        ],
        answers: {
          "1": { text: "User answer 1", type: "openended" },
          "2": { text: "User answer 2", type: "openended" },
        },
        title: "Open-Ended Quiz",
        results: null, // No results, should be generated
      },
      auth: {
        isAuthenticated: true,
      },
    };
    
    const store = createStore(initialState);
    
    (useSession as jest.Mock).mockReturnValue({
      status: "authenticated",
      data: { user: { name: "Test User" } },
    });
    
    render(
      <Provider store={store}>
        <OpenEndedResultsPage params={{ slug: "test-slug" }} />
      </Provider>
    );
    
    // The component should render without errors and not redirect
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
