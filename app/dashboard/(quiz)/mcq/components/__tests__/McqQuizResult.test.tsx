import React from "react"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import McqQuizResult from "../McqQuizResult"
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))
describe("McqQuizResult", () => {
  const result = {
    quizId: "quiz1",
    slug: "quiz1",
    title: "Test Quiz",
    completedAt: new Date().toISOString(),
    score: 2,
    maxScore: 3,
    percentage: 67,
    questions: [
      { id: "q1", question: "Q1?", options: [], correctAnswer: "A" },
      { id: "q2", question: "Q2?", options: [], correctAnswer: "B" },
      { id: "q3", question: "Q3?", options: [], correctAnswer: "C" },
    ],
    answers: [
      { questionId: "q1", selectedOptionId: "A", isCorrect: true },
      { questionId: "q2", selectedOptionId: "B", isCorrect: true },
      { questionId: "q3", selectedOptionId: "D", isCorrect: false },
    ],
  }

  it("renders quiz result summary and question breakdown", async () => {
    render(<McqQuizResult result={result as any} />)
    await waitFor(() => {
      expect(screen.getByText(/Test Quiz/i)).toBeInTheDocument()
      expect(screen.getByText(/67%/i)).toBeInTheDocument()
      expect(screen.getByText(/2 out of 3 correct/i)).toBeInTheDocument()
      expect(screen.getByText(/Q1\?/i)).toBeInTheDocument()
      expect(screen.getByText(/Q2\?/i)).toBeInTheDocument()
      expect(screen.getByText(/Q3\?/i)).toBeInTheDocument()
    })
  })

  it("handles missing or invalid result gracefully", async () => {
    jest.useFakeTimers()
    render(<McqQuizResult result={null as any} />)
    act(() => {
      jest.runAllTimers()
    })
    await waitFor(() => {
      expect(
        screen.getByText((content) => /error loading results/i.test(content))
      ).toBeInTheDocument()
    })
    jest.useRealTimers()
  })

  it("shows loading state initially", () => {
    jest.useFakeTimers()
    render(<McqQuizResult result={result as any} />)
    expect(screen.getByText(/Loading results/i)).toBeInTheDocument()
    jest.runAllTimers()
    jest.useRealTimers()
  })

  it("handles download and share actions", async () => {
    render(<McqQuizResult result={result as any} />)
    await waitFor(() => {
      expect(screen.getByText(/Download/i)).toBeInTheDocument()
      expect(screen.getByText(/Share/i)).toBeInTheDocument()
    })
  })
})
