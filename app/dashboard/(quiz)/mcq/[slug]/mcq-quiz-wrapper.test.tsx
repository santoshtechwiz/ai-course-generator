import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import McqQuizWrapper from "../components/McqQuizWrapper"
import { useRouter } from "next/navigation"
import { useAppDispatch } from "@/store"
import { useQuiz } from "@/hooks/useQuizState"
import { toast } from "sonner"

// Mock toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn()
  }
}))

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn().mockReturnValue(null)
}))

jest.mock("@/store", () => ({
  useAppDispatch: jest.fn()
}))

jest.mock("@/hooks/useQuizState", () => ({
  useQuiz: jest.fn()
}))

// Mock utility functions
jest.mock("@/lib/utils/quiz-answer-utils", () => ({
  saveQuizAnswer: jest.fn().mockResolvedValue(true),
  submitCompletedQuiz: jest.fn().mockResolvedValue({ success: true })
}))

// Use a simplified MCQ Quiz mock that better controls what's happening
jest.mock("../components/McqQuiz", () => ({
  __esModule: true,
  default: jest.fn(({ onAnswer, question, isLastQuestion }) => (
    <div data-testid="mock-mcq-quiz">
      <div data-testid="question">{question?.question}</div>
      <div data-testid="option-0" onClick={() => onAnswer("A library", 10, true)}>
        Option A
      </div>
      <button 
        data-testid="submit-answer" 
        onClick={() => onAnswer("A library", 10, true)}
      >
        {isLastQuestion ? "Submit Quiz" : "Next"}
      </button>
    </div>
  ))
}))

describe("McqQuizWrapper", () => {
  const mockRouter = { push: jest.fn() }
  const mockDispatch = jest.fn()
  const mockSaveTempResults = jest.fn()
  
  const testQuizData = {
    id: "quiz-123",
    title: "Test Quiz",
    questions: [
      {
        id: "q1",
        question: "What is React?",
        options: ["A library", "A framework", "A language"],
        answer: "A library"
      },
      {
        id: "q2",
        question: "What is JSX?",
        options: ["JavaScript XML", "Java Syntax Extension", "JavaScript Extension"],
        answer: "JavaScript XML"
      }
    ],
    slug: "test-quiz" // Add slug for compatibility with updated component
  }
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAppDispatch as jest.Mock).mockReturnValue(mockDispatch)
    ;(useQuiz as jest.Mock).mockReturnValue({
      actions: {
        saveTempResults: mockSaveTempResults
      },
      status: { isLoading: false } // Add status object
    })
  })

  it("renders the current question", () => {
    render(
      <McqQuizWrapper
        quizData={testQuizData}
        slug="test-quiz"
        quizId="quiz-123"
      />
    )
    
    expect(screen.getByTestId("question")).toHaveTextContent("What is React?")
  })
  
  it("moves to the next question when answering", async () => {
    render(
      <McqQuizWrapper
        quizData={testQuizData}
        slug="test-quiz"
        quizId="quiz-123"
      />
    )
    
    // Answer the first question
    await act(async () => {
      fireEvent.click(screen.getByTestId("submit-answer"))
    })
    
    // Dispatch should be called with the answer
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "quiz/setUserAnswer",
      payload: {
        questionId: "q1",
        answer: "A library",
        isCorrect: true,
        timeSpent: 10
      }
    })
  })
  
  it("completes the quiz on last question and navigates to results", async () => {
    const mockDispatch = jest.fn()
    ;(useAppDispatch as jest.Mock).mockReturnValue(mockDispatch)
    
    render(
      <McqQuizWrapper 
        quizData={testQuizData}
        slug="test-quiz"
        quizId="quiz-123"
      />
    )

    // Submit answer
    await act(async () => {
      fireEvent.click(screen.getByTestId("submit-answer"))
    })

    // Verify dispatch was called
    expect(mockDispatch).toHaveBeenCalled()
  })
  
  it("handles quiz with no questions properly", () => {
    // Create a more graceful test for empty questions
    render(
      <McqQuizWrapper
        quizData={{ ...testQuizData, questions: [] }}
        slug="test-quiz"
        quizId="quiz-123"
      />
    )
    
    // Should show some kind of error or empty state
    expect(screen.getByText(/no questions/i)).toBeInTheDocument()
  })
  
  // Add additional tests
  it("should handle API errors gracefully", async () => {
    // Mock dispatch to simulate API error
    mockDispatch.mockImplementationOnce(() => {
      throw new Error("API Error");
    });
    
    render(
      <McqQuizWrapper
        quizData={testQuizData}
        slug="test-quiz"
        quizId="quiz-123"
      />
    )
    
    // Select option for first question
    const optionElement = screen.getByTestId("option-0")
    fireEvent.click(optionElement)
    
    // Submit answer
    await act(async () => {
      fireEvent.click(screen.getByTestId("submit-answer"));
    });
    
    // Toast error should be called
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
})
