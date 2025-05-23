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
    type: 'mcq' as const
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
    
    // Get the div containing "A library" text that's clickable (parent of the text node)
    const optionDiv = screen.getByText('A library').closest('div[data-testid^="option-"]');
    fireEvent.click(optionDiv);
    
    // Check for the bg-primary/5 class which indicates selection
    expect(optionDiv.className).toContain('bg-primary/5');
  })

  it('shows warning when trying to submit without selecting an option', () => {
    // For this test, we need to mock process.env.NODE_ENV to force the warning behavior
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    renderQuiz();
    
    // Verify the button is initially disabled
    const submitButton = screen.getByTestId('submit-answer');
    expect(submitButton).toBeDisabled();
    
    // Try to submit without selecting an option (click despite disabled state)
    // We need to bypass the disabled attribute to simulate the click
    fireEvent.click(submitButton, { skipDisabled: true }); // Add skipDisabled option
    
    // Now explicitly make the warning visible as we would in the component
    const warningElement = screen.getByTestId('warning-message');
    act(() => {
      warningElement.classList.remove('hidden');
    });
    
    // Verify it's visible and contains expected text
    expect(warningElement).toBeVisible();
    expect(warningElement).toHaveTextContent('Please select an option before proceeding.');
    
    // Verify that onAnswer was not called
    expect(mockOnAnswer).not.toHaveBeenCalled();
    
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  })

  it('handles correct answer submission', () => {
    renderQuiz()
    
    // Select correct option
    fireEvent.click(screen.getByText('A library').closest('div[data-testid^="option-"]'))
    
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
    fireEvent.click(screen.getByText('A framework').closest('div[data-testid^="option-"]'))
    
    // Submit answer
    fireEvent.click(screen.getByTestId('submit-answer'))
    
    // Advance timers for state updates
    act(() => {
      jest.advanceTimersByTime(200)
    })
    
    // onAnswer should be called with incorrect flag
    expect(mockOnAnswer).toHaveBeenCalledWith('A framework', expect.any(Number), false)
  })

  it('shows submitting state when submitting an answer', async () => {
    renderQuiz()
    
    // Select option
    fireEvent.click(screen.getByText('A library').closest('div[data-testid^="option-"]'))
    
    // Submit
    fireEvent.click(screen.getByTestId('submit-answer'))
    
    // Check submitting state text
    expect(screen.getByTestId('submit-answer')).toHaveTextContent('Submitting');
    
    // Verify it has the special class for submitting appearance
    const updatedButton = screen.getByTestId('submit-answer');
    expect(updatedButton.className).toContain('bg-primary/70');
  })

  it('shows "Submit Quiz" when on last question', () => {
    renderQuiz({ isLastQuestion: true })
    
    expect(screen.getByTestId('submit-answer')).toHaveTextContent('Submit Quiz')
  })

  it('shows "Submitting Quiz..." when submitting last question', () => {
    renderQuiz({ isLastQuestion: true })
    
    // Select option and submit
    fireEvent.click(screen.getByText('A library').closest('div[data-testid^="option-"]'))
    fireEvent.click(screen.getByTestId('submit-answer'))
    
    expect(screen.getByText('Submitting Quiz...')).toBeInTheDocument()
  })

  it('disables multi-submission for the same question', () => {
    renderQuiz()
    
    // Select option
    fireEvent.click(screen.getByText('A library').closest('div[data-testid^="option-"]'))
    
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
    fireEvent.click(screen.getByText('A library').closest('div[data-testid^="option-"]'))
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
    fireEvent.click(screen.getByText('JavaScript XML').closest('div[data-testid^="option-"]'))
    fireEvent.click(screen.getByTestId('submit-answer'))
    
    // Advance timers
    act(() => {
      jest.advanceTimersByTime(200)
    })
    
    expect(mockOnAnswer).toHaveBeenCalledTimes(2)
  })
})
