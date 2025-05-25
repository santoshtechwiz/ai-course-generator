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
  default: jest.fn(({ onAnswer, question, isLastQuestion }) => {
    // Consistent answer for tests
    const answer = "A library"; 
    const isCorrect = true;
    
    return (
      <div data-testid="mock-mcq-quiz">
        <div data-testid="question">{question?.question}</div>
        <button 
          data-testid="submit-answer" 
          onClick={() => {
            // Just pass the hard-coded values with fixed elapsedTime of 10
            onAnswer(answer, 10, isCorrect);
          }}
        >
          {isLastQuestion ? "Submit Quiz" : "Next"}
        </button>
      </div>
    )
  })
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
    ]
  }
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAppDispatch as jest.Mock).mockReturnValue(mockDispatch)
    ;(useQuiz as jest.Mock).mockReturnValue({
      actions: {
        saveTempResults: mockSaveTempResults
      }
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
    render(
      <McqQuizWrapper
        quizData={testQuizData}
        slug="test-quiz"
        quizId="quiz-123"
      />
    )
    
    // Answer first question
    await act(async () => {
      fireEvent.click(screen.getByTestId("submit-answer"))
    })
    
    // Now on second question - answer it
    await act(async () => {
      fireEvent.click(screen.getByTestId("submit-answer"))
    })
    
    // Check for quiz submit action
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: "quiz/submitQuiz"
    }))
    
    // Should save temp results
    expect(mockSaveTempResults).toHaveBeenCalled()
    
    // Should navigate to results
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/mcq/test-quiz/results")
    })
  })
  
  it("handles quiz with no questions properly", () => {
    render(
      <McqQuizWrapper
        quizData={{ ...testQuizData, questions: [] }}
        slug="test-quiz"
        quizId="quiz-123"
      />
    )
    
    expect(screen.getByText("This quiz has no questions")).toBeInTheDocument()
  })
})
