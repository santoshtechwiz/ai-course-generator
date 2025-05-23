import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import CodeQuizResult from './CodeQuizResult'
import { toast } from 'sonner'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn()
  }
}))

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('CodeQuizResult Component', () => {
  const mockRouter = { push: jest.fn() }
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    
    // Reset any mocked timers
    jest.useRealTimers()
  })
  
  it('renders error message for invalid result data', async () => {
    // Use fake timers to control setTimeout
    jest.useFakeTimers()
    
    render(<CodeQuizResult result={undefined as any} />)
    
    // Fast-forward through the loading timer
    act(() => {
      jest.advanceTimersByTime(1100)
    })
    
    // Should show error message
    expect(screen.getByTestId('results-error')).toBeInTheDocument()
    expect(screen.getByText('Results Not Available')).toBeInTheDocument()
  })
  
  it('renders quiz results correctly', async () => {
    const mockResult = {
      quizId: 'quiz-123',
      slug: 'test-code-quiz',
      title: 'Test Code Quiz',
      score: 2,
      maxScore: 3,
      percentage: 66,
      completedAt: '2023-05-01',
      questions: [
        {
          id: 'q1',
          question: 'Write a function to add two numbers',
          userAnswer: 'function add(a, b) { return a + b; }',
          correctAnswer: 'function add(a, b) { return a + b; }',
          isCorrect: true
        },
        {
          id: 'q2',
          question: 'Write a function to multiply two numbers',
          userAnswer: 'function multiply(a, b) { return a * b; }',
          correctAnswer: 'function multiply(a, b) { return a * b; }',
          isCorrect: true
        },
        {
          id: 'q3',
          question: 'Write a function to divide two numbers',
          userAnswer: 'function divide(a, b) { return a / b; }',
          correctAnswer: 'function divide(a, b) { if(b === 0) throw new Error("Cannot divide by zero"); return a / b; }',
          isCorrect: false
        }
      ]
    }
    
    // Use fake timers to control setTimeout
    jest.useFakeTimers()
    
    render(<CodeQuizResult result={mockResult} />)
    
    // Fast-forward through the loading timer
    act(() => {
      jest.advanceTimersByTime(1100)
    })
    
    // Check that the component renders the score properly
    expect(screen.getByTestId('code-quiz-result')).toBeInTheDocument()
    expect(screen.getByTestId('score-percentage')).toHaveTextContent('67%')
    
    // Test tab navigation
    fireEvent.click(screen.getByText('Correct'))
    expect(screen.getByText('Write a function to add two numbers')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Review'))
    expect(screen.getByText('Write a function to divide two numbers')).toBeInTheDocument()
    
    // Test retry button navigation
    fireEvent.click(screen.getByTestId('retry-quiz-button'))
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/code/test-code-quiz')
  })
  
  it('handles sharing results', async () => {
    const mockResult = {
      quizId: 'quiz-123',
      slug: 'test-code-quiz',
      title: 'Test Code Quiz',
      score: 2,
      maxScore: 3,
      percentage: 66,
      completedAt: '2023-05-01',
      questions: [
        {
          id: 'q1',
          question: 'Test Question',
          userAnswer: 'Test Answer',
          correctAnswer: 'Correct Answer',
          isCorrect: true
        }
      ]
    }
    
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    })
    
    // Use fake timers to control setTimeout
    jest.useFakeTimers()
    
    render(<CodeQuizResult result={mockResult} />)
    
    // Fast-forward through the loading timer
    act(() => {
      jest.advanceTimersByTime(1100)
    })
    
    // Find and click the share button
    const shareButton = screen.getByText('Share').closest('button')
    fireEvent.click(shareButton as HTMLElement)
    
    // Clipboard should have been called
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard!')
    })
  })
})
