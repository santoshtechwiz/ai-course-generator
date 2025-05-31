import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import { useDispatch, useSelector } from "react-redux"
import McqResultsPage from "./page"

// Mock react components
jest.mock("@/app/dashboard/(quiz)/components/QuizLoadingSteps", () => ({
  QuizLoadingSteps: () => <div data-testid="loading-steps">Loading...</div>,
}))
jest.mock("../../components/McqQuizResult", () => ({
  __esModule: true,
  default: ({ result }: any) => (
    <div data-testid="quiz-results">
      <div>Your Score: {result?.score || ''} / {result?.maxScore || ''}</div>
    </div>
  ),
}))

// Mock NonAuthenticatedUserSignInPrompt
jest.mock("@/app/dashboard/(quiz)/components/EnhancedNonAuthenticatedUserSignInPrompt", () => ({
  NonAuthenticatedUserSignInPrompt: ({ onSignIn, title, message }: any) => (
    <div data-testid="sign-in-prompt">
      <h2>{title || "Sign In to View Results"}</h2>
      <p>{message || "Please sign in to continue"}</p>
      <button onClick={onSignIn}>Sign In</button>
    </div>
  ),
}))

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}))

// Setup Redux mock with proper state structure
const mockState = {
  quiz: {
    questions: [],
    answers: {},
    status: "idle",
    results: null,
    error: null,
    quizId: "test-quiz",
    slug: "test-quiz",
    title: "Test Quiz",
    isCompleted: false,
    currentQuestionIndex: 0,
  }
};

// Mock react-redux
jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}))

describe("McqResultsPage", () => {
  const mockRouter = { push: jest.fn() };
  const mockDispatch = jest.fn();
  const mockParams = { slug: "test-quiz" };
  
  // Set up default mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock router
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock search params
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation(param => param === "fromAuth" ? null : null)
    });
    
    // Mock dispatch
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    
    // Default selector implementation
    (useSelector as jest.Mock).mockImplementation((selectorFn) => {
      // When called with a function, try to simulate selector behavior
      if (typeof selectorFn === 'function') {
        try {
          return selectorFn(mockState);
        } catch (e) {
          // If selector fails, return sensible defaults based on selector name
          const selectorString = selectorFn.toString();
          if (selectorString.includes('selectQuizResults')) {
            return { slug: "test-quiz", score: 1, maxScore: 2, percentage: 50 };
          }
          if (selectorString.includes('selectOrGenerateQuizResults')) {
            return { slug: "test-quiz", score: 1, maxScore: 2, percentage: 50 };
          }
          if (selectorString.includes('selectAnswers')) {
            return { question1: "answer1" };
          }
          if (selectorString.includes('selectQuizStatus')) {
            return "idle";
          }
          return null;
        }
      }
      return null;
    });
    
    // Default session
    (useSession as jest.Mock).mockReturnValue({ status: "loading", data: null });
  });

  it("renders loading state when auth status is loading", () => {
    (useSession as jest.Mock).mockReturnValue({ status: "loading", data: null });
    render(<McqResultsPage params={mockParams} />);
    expect(screen.getByTestId("loading-steps")).toBeInTheDocument();
  });

  it("redirects to quiz page when no results or answers exist", async () => {
    // Setup for this specific test
    (useSession as jest.Mock).mockReturnValue({ 
      status: "authenticated", 
      data: { user: { name: "Test User" } } 
    });
    
    // Configure selectors to return no results or answers
    (useSelector as jest.Mock).mockImplementation((selectorFn) => {
      const selectorString = selectorFn.toString();
      if (selectorString.includes('selectQuizResults')) {
        return null;
      }
      if (selectorString.includes('selectOrGenerateQuizResults')) {
        return null;
      }
      if (selectorString.includes('selectAnswers')) {
        return {};
      }
      if (selectorString.includes('selectQuizStatus')) {
        return "idle";
      }
      return null;
    });
    
    // Use fake timers to control setTimeout
    jest.useFakeTimers();
    
    render(<McqResultsPage params={mockParams} />);
    
    // Fast-forward time to trigger the redirect
    act(() => {
      jest.advanceTimersByTime(1100);
    });
    
    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/mcq/test-quiz");
    
    // Restore real timers
    jest.useRealTimers();
  });

  it("shows sign-in prompt for unauthenticated users", () => {
    // Setup for unauthenticated user
    (useSession as jest.Mock).mockReturnValue({ 
      status: "unauthenticated", 
      data: null 
    });
    
    // Mock results to exist so we show sign-in prompt instead of no results message
    (useSelector as jest.Mock).mockImplementation((selectorFn) => {
      const selectorString = selectorFn.toString();
      if (selectorString.includes('selectQuizResults') || 
          selectorString.includes('selectOrGenerateQuizResults')) {
        return { slug: "test-quiz", score: 1, maxScore: 2, percentage: 50 };
      }
      if (selectorString.includes('selectAnswers')) {
        return { question1: "answer1" };
      }
      if (selectorString.includes('selectQuizStatus')) {
        return "idle";
      }
      return null;
    });
    
    render(<McqResultsPage params={mockParams} />);
    
    expect(screen.getByTestId("sign-in-prompt")).toBeInTheDocument();
    expect(screen.getByText("Sign In to View Results")).toBeInTheDocument();
  });

  it("shows full results for authenticated users", () => {
    // Setup for authenticated user
    (useSession as jest.Mock).mockReturnValue({ 
      status: "authenticated", 
      data: { user: { name: "Test User" } } 
    });
    
    // Setup quiz results
    (useSelector as jest.Mock).mockImplementation((selectorFn) => {
      const selectorString = selectorFn.toString();
      if (selectorString.includes('selectQuizResults') || 
          selectorString.includes('selectOrGenerateQuizResults')) {
        return { slug: "test-quiz", score: 1, maxScore: 2, percentage: 50 };
      }
      if (selectorString.includes('selectAnswers')) {
        return { question1: "answer1" };
      }
      if (selectorString.includes('selectQuizStatus')) {
        return "idle";
      }
      return null;
    });
    
    render(<McqResultsPage params={mockParams} />);
    
    expect(screen.getByTestId("quiz-results")).toBeInTheDocument();
    expect(screen.getByText(/your score: 1 \/ 2/i)).toBeInTheDocument();
  });

  it("handles retake quiz action", async () => {
    // Setup for authenticated user
    (useSession as jest.Mock).mockReturnValue({ 
      status: "authenticated", 
      data: { user: { name: "Test User" } } 
    });
    
    render(<McqResultsPage params={mockParams} />);
    
    const user = userEvent.setup();
    
    const retakeButton = screen.getByRole("button", { name: /retake quiz/i });
    
    await user.click(retakeButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/mcq/test-quiz?reset=true");
  });

  it("handles sign-in action for unauthenticated users", async () => {
    // Setup for unauthenticated user
    (useSession as jest.Mock).mockReturnValue({ 
      status: "unauthenticated", 
      data: null 
    });
    
    // Mock results to exist so we show sign-in prompt instead of no results message
    (useSelector as jest.Mock).mockImplementation((selectorFn) => {
      const selectorString = selectorFn.toString();
      if (selectorString.includes('selectQuizResults') || 
          selectorString.includes('selectOrGenerateQuizResults')) {
        return { slug: "test-quiz", score: 1, maxScore: 2, percentage: 50 };
      }
      return null;
    });
    
    render(<McqResultsPage params={mockParams} />);
    
    const user = userEvent.setup();
    const signInButton = screen.getByRole("button", { name: /sign in/i });
    
    await user.click(signInButton);
    
    expect(signIn).toHaveBeenCalled();
  });

  it("restores quiz state after authentication", () => {
    // Setup for authenticated user
    (useSession as jest.Mock).mockReturnValue({ 
      status: "authenticated", 
      data: { user: { name: "Test User" } } 
    });
    
    // Set fromAuth parameter to true
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation(param => param === "fromAuth" ? "true" : null)
    });
    
    // Mock restoreAuthRedirectState to return something
    mockDispatch.mockReturnValueOnce({
      quizState: {
        currentState: {
          results: { score: 1, maxScore: 2 }
        }
      }
    });
    
    render(<McqResultsPage params={mockParams} />);
    
    // Check if dispatch was called for restoring state
    expect(mockDispatch).toHaveBeenCalled();
  });
});
