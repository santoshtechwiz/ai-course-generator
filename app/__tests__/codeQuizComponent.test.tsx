"use client"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import CodingQuiz from "../dashboard/(quiz)/code/components/CodingQuiz"

// Mock the useQuiz hook
jest.mock("../context/QuizContext", () => ({
  useQuiz: () => ({
    state: {},
  }),
}))

// Mock the AnimationProvider
jest.mock("@/providers/animation-provider", () => ({
  useAnimation: () => ({
    animate: jest.fn((id, callback) => callback()), // Execute the callback immediately
    isAnimating: false,
  }),
}))

// Mock the CodeQuizEditor component
jest.mock("../dashboard/(quiz)/code/components/CodeQuizEditor", () => {
  return function MockCodeQuizEditor({ value, onChange }) {
    return (
      <div data-testid="code-editor">
        <textarea data-testid="code-textarea" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    )
  }
})

// Mock the SyntaxHighlighter component
jest.mock("react-syntax-highlighter", () => ({
  Prism: ({ children }) => <pre data-testid="syntax-highlighter">{children}</pre>,
}))

jest.mock("react-syntax-highlighter/dist/cjs/styles/prism", () => ({
  vscDarkPlus: {},
}))

// Sample question for testing
const mockQuestion = {
  id: "q1",
  question: "Write a function that adds two numbers",
  codeSnippet: "function add(a, b) {\n  // Your code here\n}",
  language: "javascript",
  answer: "return a + b",
  options: ["return a + b", "return a - b", "return a * b", "return a / b"],
}

describe("CodingQuiz Component", () => {
  test("renders the question and code editor", () => {
    const handleAnswer = jest.fn()

    render(<CodingQuiz question={mockQuestion} onAnswer={handleAnswer} questionNumber={1} totalQuestions={3} />)

    // Check if the question is displayed
    expect(screen.getByText(/Write a function that adds two numbers/i)).toBeInTheDocument()

    // Check if the code editor is rendered
    expect(screen.getByTestId("code-editor")).toBeInTheDocument()

    // Check if the progress indicator is correct
    expect(screen.getByText(/Question 1 of 3/i)).toBeInTheDocument()
  })

  test("allows editing code in the editor", () => {
    const handleAnswer = jest.fn()

    render(<CodingQuiz question={mockQuestion} onAnswer={handleAnswer} questionNumber={1} totalQuestions={3} />)

    // Get the code textarea
    const codeTextarea = screen.getByTestId("code-textarea")

    // Check initial value
    expect(codeTextarea).toHaveValue("function add(a, b) {\n  // Your code here\n}")

    // Change the code
    fireEvent.change(codeTextarea, {
      target: { value: "function add(a, b) {\n  return a + b;\n}" },
    })

    // Check updated value
    expect(codeTextarea).toHaveValue("function add(a, b) {\n  return a + b;\n}")
  })



  test("shows 'Finish Quiz' instead of 'Next Question' on the last question", () => {
    const handleAnswer = jest.fn()

    render(<CodingQuiz question={mockQuestion} onAnswer={handleAnswer} questionNumber={3} totalQuestions={3} />)

    // Check if the button text is "Finish Quiz"
    expect(screen.getByText("Finish Quiz")).toBeInTheDocument()
    expect(screen.queryByText("Next Question")).not.toBeInTheDocument()
  })



})
