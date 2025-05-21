import { render, screen, fireEvent, act } from '@testing-library/react'
import McqQuiz from './McqQuiz'

// Mock the animation provider
jest.mock('@/providers/animation-provider', () => ({
  useAnimation: () => ({ animationsEnabled: false })
}))

describe('McqQuiz Component', () => {
  const mockQuestion = {
    id: 'q1',
    question: 'What is React?',
    options: ['A library', 'A framework', 'A language'],
    answer: 'A library',
    type: 'mcq'
  }

  const mockOnAnswer = jest.fn()

  const renderQuiz = (props = {}) => {
    return render(
      <McqQuiz
        question={mockQuestion}
        onAnswer={mockOnAnswer}
        questionNumber={1}
        totalQuestions={3}
        isLastQuestion={false}
        isSubmitting={false}
        {...props}
      />
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders the question and options correctly', () => {
    renderQuiz()
    
    expect(screen.getByTestId('question-text')).toHaveTextContent('What is React?')
    expect(screen.getByText('A library')).toBeInTheDocument()
    expect(screen.getByText('A framework')).toBeInTheDocument()
    expect(screen.getByText('A language')).toBeInTheDocument()
  })

  it('allows selecting an option', () => {
    renderQuiz()
    
    fireEvent.click(screen.getByText('A library'))
    expect(screen.getByText('A library').closest('div')?.classList.contains('border-primary')).toBeTruthy()
  })

  it('shows warning when trying to submit without selecting an option', () => {
    const { container } = renderQuiz()
    
    // Try to submit without selecting an option
    fireEvent.click(screen.getByTestId('submit-answer'))
    
    expect(container.querySelector('.bg-amber-50')).toBeInTheDocument()
    expect(mockOnAnswer).not.toHaveBeenCalled()
  })

  it('handles correct answer submission', () => {
    renderQuiz()
    
    // Select correct option
    fireEvent.click(screen.getByText('A library'))
    
    // Submit answer
    fireEvent.click(screen.getByTestId('submit-answer'))
    
    // Advance timers for state updates
    act(() => {
      jest.advanceTimersByTime(200)
    })
    
    // onAnswer should be called with correct flag
    expect(mockOnAnswer).toHaveBeenCalledWith('A library', expect.any(Number), true)
  })

  it('handles incorrect answer submission', () => {
    renderQuiz()
    
    // Select incorrect option
    fireEvent.click(screen.getByText('A framework'))
    
    // Submit answer
    fireEvent.click(screen.getByTestId('submit-answer'))
    
    // Advance timers for state updates
    act(() => {
      jest.advanceTimersByTime(200)
    })
    
    // onAnswer should be called with incorrect flag
    expect(mockOnAnswer).toHaveBeenCalledWith('A framework', expect.any(Number), false)
  })

  it('shows submitting state when submitting an answer', () => {
    renderQuiz()
    
    // Select option
    fireEvent.click(screen.getByText('A library'))
    
    // Submit
    fireEvent.click(screen.getByTestId('submit-answer'))
    
    // Should show loading state
    expect(screen.getByText('Submitting...')).toBeInTheDocument()
    expect(screen.getByTestId('submit-answer')).toBeDisabled()
  })

  it('shows "Submit Quiz" when on last question', () => {
    renderQuiz({ isLastQuestion: true })
    
    expect(screen.getByTestId('submit-answer')).toHaveTextContent('Submit Quiz')
  })

  it('shows "Submitting Quiz..." when submitting last question', () => {
    renderQuiz({ isLastQuestion: true })
    
    // Select option and submit
    fireEvent.click(screen.getByText('A library'))
    fireEvent.click(screen.getByTestId('submit-answer'))
    
    expect(screen.getByText('Submitting Quiz...')).toBeInTheDocument()
  })

  it('disables multi-submission for the same question', () => {
    renderQuiz()
    
    // Select option
    fireEvent.click(screen.getByText('A library'))
    
    // Submit answer
    fireEvent.click(screen.getByTestId('submit-answer'))
    
    // Try to submit again
    fireEvent.click(screen.getByTestId('submit-answer'))
    
    // Advance timers
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    // Should only call onAnswer once
    expect(mockOnAnswer).toHaveBeenCalledTimes(1)
  })

  it('resets state when question changes', () => {
    const { rerender } = renderQuiz()
    
    // Select option and submit
    fireEvent.click(screen.getByText('A library'))
    fireEvent.click(screen.getByTestId('submit-answer'))
    
    // Advance timers to complete submission
    act(() => {
      jest.advanceTimersByTime(500)
    })
    
    // Change question
    rerender(
      <McqQuiz
        question={{
          id: 'q2', // Different question ID
          question: 'What is JSX?',
          options: ['JavaScript XML', 'Java Syntax', 'JSON XML'],
          answer: 'JavaScript XML',
          type: 'mcq'
        }}
        onAnswer={mockOnAnswer}
        questionNumber={2}
        totalQuestions={3}
        isLastQuestion={false}
        isSubmitting={false}
      />
    )
    
    // Should reset submission state
    expect(screen.queryByText('Submitting...')).not.toBeInTheDocument()
    
    // Verify question changed
    expect(screen.getByTestId('question-text')).toHaveTextContent('What is JSX?')
    
    // Should be able to submit again
    fireEvent.click(screen.getByText('JavaScript XML'))
    fireEvent.click(screen.getByTestId('submit-answer'))
    
    // Advance timers
    act(() => {
      jest.advanceTimersByTime(200)
    })
    
    expect(mockOnAnswer).toHaveBeenCalledTimes(2)
  })
})
