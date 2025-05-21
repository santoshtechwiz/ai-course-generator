import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import McqQuizWrapper from "../components/McqQuizWrapper"
import { useRouter } from "next/navigation"
import { useAppDispatch } from "@/store"
import { useQuiz } from "@/hooks/useQuizState"

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

// Update the MCQ Quiz mock to better simulate real behavior
jest.mock("../components/McqQuiz", () => ({
  __esModule: true,
  default: jest.fn(({ onAnswer, question, isLastQuestion }) => {
    // Track if this is the last question to change behavior
    const isLast = isLastQuestion;
    
    return (
      <div data-testid="mock-mcq-quiz">
        <div data-testid="question">{question?.question}</div>
        <button 
          data-testid="submit-answer" 
          onClick={() => {
            // Simulate selecting correct answer for current question
            const answer = question.options?.[0] || "test-option";
            const isCorrect = true;
            onAnswer(answer, 10, isCorrect);
          }}
        >
          {isLast ? "Submit Quiz" : "Next"}
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
  
  it("moves to the next question when answering", () => {
    render(
      <McqQuizWrapper
        quizData={testQuizData}
        slug="test-quiz"
        quizId="quiz-123"
      />
    )
    
    // Answer the first question
    fireEvent.click(screen.getByTestId("submit-answer"))
    
    // Dispatch should be called with the answer
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "quiz/setUserAnswer",
      payload: expect.objectContaining({
        questionId: "q1",
        answer: "test-option",
        isCorrect: true
      })
    })
  })
  
  it("completes the quiz on last question and navigates to results", () => {
    render(
      <McqQuizWrapper
        quizData={testQuizData}
        slug="test-quiz"r actions first (twice, once for each question)
        quizId="quiz-123"xpect.objectContaining({
      />r",
    )
    anything(),
    // Answer first questionthing(),
    fireEvent.click(screen.getByTestId("submit-answer"))expect.anything(),
    
    // Now on second question - answer it);
    fireEvent.click(screen.getByTestId("submit-answer"))
     quiz/submitQuiz action
    // Should dispatch the submitQuiz actionct.objectContaining({
    expect(mockDispatch).toHaveBeenCalledWith({  type: "quiz/submitQuiz",
      type: "quiz/submitQuiz",ining({
      payload: expect.objectContaining({
        quizId: "quiz-123",    slug: "test-quiz",
        slug: "test-quiz",      type: "mcq"
        type: "mcq"
      })
    })
    
    // Should save temp resultsesults).toHaveBeenCalled()
    expect(mockSaveTempResults).toHaveBeenCalled()
    hould navigate to results
    // Should navigate to resultsxpect(mockRouter.push).toHaveBeenCalledWith("/dashboard/mcq/test-quiz/results")
    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/mcq/test-quiz/results")
  })
  ("handles quiz with no questions properly", () => {
  it("handles quiz with no questions properly", () => {  render(
    render(      <McqQuizWrapper











})  })    expect(screen.getByText("This quiz has no questions")).toBeInTheDocument()        )      />        quizId="quiz-123"        slug="test-quiz"        quizData={{ ...testQuizData, questions: [] }}      <McqQuizWrapper        quizData={{ ...testQuizData, questions: [] }}
        slug="test-quiz"
        quizId="quiz-123"
      />
    )
    
    expect(screen.getByText("This quiz has no questions")).toBeInTheDocument()
  })
})
