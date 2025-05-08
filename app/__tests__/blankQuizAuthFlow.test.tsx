"use client"
import { render, screen, fireEvent, act } from "@testing-library/react"
import BlanksQuiz from "../dashboard/(quiz)/blanks/components/BlanksQuiz"

// Mock the timer
jest.useFakeTimers()

describe("BlanksQuiz", () => {
  // Sample question data
  const mockQuestion = {
    id: "q1",
    question: "The capital of France is [[Paris]].",
    hints: ["It starts with 'P' and ends with 's'."],
  }

  // Mock functions
  const mockOnAnswer = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("renders question and input field correctly", () => {
    render(
      <BlanksQuiz
        question={mockQuestion}
        onAnswer={mockOnAnswer}
        questionNumber={1}
        totalQuestions={4}
        isLastQuestion={false}
      />,
    )

    // Check that the component renders
    expect(screen.getByTestId("blanks-quiz-component")).toBeInTheDocument()

    // Check that the question is displayed correctly with blank
    expect(screen.getByTestId("question-text")).toHaveTextContent("The capital of France is ________.")

    // Check that the input field is displayed
    expect(screen.getByTestId("answer-input")).toBeInTheDocument()

    // Check that the question number is displayed correctly
    expect(screen.getByText("Question 1 of 4")).toBeInTheDocument()
  })

  test("submit button is disabled until an answer is entered", () => {
    render(
      <BlanksQuiz
        question={mockQuestion}
        onAnswer={mockOnAnswer}
        questionNumber={1}
        totalQuestions={4}
        isLastQuestion={false}
      />,
    )

    // Check that the submit button is disabled initially
    const submitButton = screen.getByTestId("submit-button")
    expect(submitButton).toBeDisabled()

    // Enter an answer
    fireEvent.change(screen.getByTestId("answer-input"), { target: { value: "Paris" } })

    // Check that the submit button is now enabled
    expect(submitButton).not.toBeDisabled()
  })

  test("calls onAnswer with correct parameters when submitting", () => {
    jest.useFakeTimers()

    render(
      <BlanksQuiz
        question={mockQuestion}
        onAnswer={mockOnAnswer}
        questionNumber={1}
        totalQuestions={4}
        isLastQuestion={false}
      />,
    )

    // Enter an answer
    fireEvent.change(screen.getByTestId("answer-input"), { target: { value: "Paris" } })

    // Submit the answer
    fireEvent.click(screen.getByTestId("submit-button"))

    // Fast-forward timers
    act(() => {
      jest.advanceTimersByTime(300)
    })

    // Check that onAnswer was called with the correct parameters
    expect(mockOnAnswer).toHaveBeenCalledWith("Paris", expect.any(Number), false)
  })

  test("displays 'Finish Quiz' text when it's the last question", () => {
    render(
      <BlanksQuiz
        question={mockQuestion}
        onAnswer={mockOnAnswer}
        questionNumber={4}
        totalQuestions={4}
        isLastQuestion={true}
      />,
    )

    // Enter an answer to enable the button
    fireEvent.change(screen.getByTestId("answer-input"), { target: { value: "Paris" } })

    // Check that the button text is "Finish Quiz"
    expect(screen.getByTestId("submit-button")).toHaveTextContent("Finish Quiz")
  })

  test("displays 'Next Question' text when it's not the last question", () => {
    render(
      <BlanksQuiz
        question={mockQuestion}
        onAnswer={mockOnAnswer}
        questionNumber={1}
        totalQuestions={4}
        isLastQuestion={false}
      />,
    )

    // Enter an answer to enable the button
    fireEvent.change(screen.getByTestId("answer-input"), { target: { value: "Paris" } })

    // Check that the button text is "Next Question"
    expect(screen.getByTestId("submit-button")).toHaveTextContent("Next Question")
  })

  test("updates timer correctly", () => {
    jest.useFakeTimers()

    render(
      <BlanksQuiz
        question={mockQuestion}
        onAnswer={mockOnAnswer}
        questionNumber={1}
        totalQuestions={4}
        isLastQuestion={false}
      />,
    )

    // Check initial timer value
    expect(screen.getByText("Time: 00:00")).toBeInTheDocument()

    // Advance timer by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    // Check updated timer value
    expect(screen.getByText("Time: 00:05")).toBeInTheDocument()

    // Advance timer by another 60 seconds
    act(() => {
      jest.advanceTimersByTime(60000)
    })

    // Check updated timer value
    expect(screen.getByText("Time: 01:05")).toBeInTheDocument()
  })



  test("disables submit button while submitting", () => {
    render(
      <BlanksQuiz
        question={mockQuestion}
        onAnswer={mockOnAnswer}
        questionNumber={1}
        totalQuestions={4}
        isLastQuestion={false}
      />,
    )

    // Enter an answer
    fireEvent.change(screen.getByTestId("answer-input"), { target: { value: "Paris" } })

    // Submit the answer
    fireEvent.click(screen.getByTestId("submit-button"))

    // Check that the submit button is disabled during submission
    expect(screen.getByTestId("submit-button")).toBeDisabled()
    expect(screen.getByTestId("submit-button")).toHaveTextContent("Submitting...")
  })

  test("shows hint when hint button is clicked", () => {
    render(
      <BlanksQuiz
        question={mockQuestion}
        onAnswer={mockOnAnswer}
        questionNumber={1}
        totalQuestions={4}
        isLastQuestion={false}
      />,
    )

    // Check that hint is not initially displayed
    expect(screen.queryByText("Hint")).not.toBeInTheDocument()

    // Click the hint button
    fireEvent.click(screen.getByTestId("hint-button"))

    // Check that hint is now displayed
    expect(screen.getByText("Hint")).toBeInTheDocument()
    expect(screen.getByText("It starts with 'P' and ends with 's'.")).toBeInTheDocument()
  })

  test("passes hintsUsed flag when answer is submitted after using hint", () => {
    render(
      <BlanksQuiz
        question={mockQuestion}
        onAnswer={mockOnAnswer}
        questionNumber={1}
        totalQuestions={4}
        isLastQuestion={false}
      />,
    )

    // Click the hint button
    fireEvent.click(screen.getByTestId("hint-button"))

    // Enter an answer
    fireEvent.change(screen.getByTestId("answer-input"), { target: { value: "Paris" } })

    // Submit the answer
    fireEvent.click(screen.getByTestId("submit-button"))

    // Fast-forward timers
    act(() => {
      jest.advanceTimersByTime(300)
    })

    // Check that onAnswer was called with hintsUsed=true
    expect(mockOnAnswer).toHaveBeenCalledWith("Paris", expect.any(Number), true)
  })
})
