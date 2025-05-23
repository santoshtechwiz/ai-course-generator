import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useQuiz } from '@/hooks/useQuizState'
import McqQuizPage from '@/app/dashboard/(quiz)/mcq/[slug]/page'
import { useAuth } from '@/hooks/useAuth'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock useAuth
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

// Mock useQuiz
jest.mock('@/hooks/useQuizState', () => ({
  useQuiz: jest.fn(),
}))

// Mock React.use
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    use: jest.fn(value => value instanceof Promise ? { slug: 'test-quiz' } : value),
  };
})

// Mock the McqQuizWrapper component
jest.mock('@/app/dashboard/(quiz)/mcq/components/McqQuizWrapper', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="mock-quiz-wrapper">Quiz Wrapper</div>),
}))

// Mock quiz state displays
jest.mock('@/app/dashboard/(quiz)/components/QuizStateDisplay', () => ({
  InitializingDisplay: () => <div data-testid="initializing-display">Initializing...</div>,
  ErrorDisplay: ({ error, onRetry, onReturn }) => (
    <div data-testid="error-display">
      <p>{error}</p>
      <button onClick={onRetry} data-testid="retry-button">Retry</button>
      <button onClick={onReturn} data-testid="return-button">Return</button>
    </div>
  ),
}))

describe('Quiz Navigation', () => {
  const mockRouter = { push: jest.fn(), replace: jest.fn() }
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    
    // Default auth state
    ;(useAuth as jest.Mock).mockReturnValue({
      userId: 'user123',
      status: 'authenticated',
    })
    
    // Default quiz state
    ;(useQuiz as jest.Mock).mockReturnValue({
      quiz: { data: null },
      status: { isLoading: false, errorMessage: null },
      actions: { loadQuiz: jest.fn() },
    })
  })
  
  describe('MCQ Quiz Page', () => {
    it('shows loading state initially', () => {
      // Set loading state
      ;(useQuiz as jest.Mock).mockReturnValue({
        quiz: { data: null },
        status: { isLoading: true },
        actions: { loadQuiz: jest.fn() },
      })
      
      render(<McqQuizPage params={{ slug: 'test-quiz' }} />)
      
      // Should show loading state
      expect(screen.getByTestId('initializing-display')).toBeInTheDocument()
    })
    
    it('loads quiz data correctly', async () => {
      // Mock loadQuiz function
      const mockLoadQuiz = jest.fn().mockResolvedValue({
        id: 'quiz-123',
        title: 'Test Quiz',
        questions: [
          { id: 'q1', question: 'Test Question', options: ['A', 'B', 'C'], answer: 'A' }
        ]
      })
      
      // Initial state - no quiz loaded yet
      ;(useQuiz as jest.Mock).mockReturnValue({
        quiz: { data: null },
        status: { isLoading: false },
        actions: { loadQuiz: mockLoadQuiz },
      })
      
      const { rerender } = render(<McqQuizPage params={{ slug: 'test-quiz' }} />)
      
      // Verify loadQuiz was called
      await waitFor(() => {
        expect(mockLoadQuiz).toHaveBeenCalledWith('test-quiz', 'mcq')
      })
      
      // Update state to simulate loaded quiz
      ;(useQuiz as jest.Mock).mockReturnValue({
        quiz: { 
          data: {
            id: 'quiz-123',
            title: 'Test Quiz',
            questions: [
              { id: 'q1', question: 'Test Question', options: ['A', 'B', 'C'], answer: 'A' }
            ]
          }
        },
        status: { isLoading: false },
        actions: { loadQuiz: mockLoadQuiz },
      })
      
      // Re-render with updated state
      rerender(<McqQuizPage params={{ slug: 'test-quiz' }} />)
      
      // Should render quiz wrapper
      expect(screen.getByTestId('mock-quiz-wrapper')).toBeInTheDocument()
    })
    
    it('shows error state when loading fails', async () => {
      // Set error state
      ;(useQuiz as jest.Mock).mockReturnValue({
        quiz: { data: null },
        status: { isLoading: false, errorMessage: 'Failed to load quiz' },
        actions: { loadQuiz: jest.fn().mockRejectedValue(new Error('API error')) },
      })
      
      render(<McqQuizPage params={{ slug: 'test-quiz' }} />)
      
      // Should show error display
      expect(screen.getByTestId('error-display')).toBeInTheDocument()
      expect(screen.getByText('Failed to load quiz')).toBeInTheDocument()
      
      // Test retry functionality
      fireEvent.click(screen.getByTestId('retry-button'))
      
      // Test return functionality
      fireEvent.click(screen.getByTestId('return-button'))
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/quizzes')
    })
  })
  
  describe('Navigation between quiz states', () => {
    it('handles quiz initialization', () => {
      // Start with loading state
      ;(useQuiz as jest.Mock).mockReturnValue({
        quiz: { data: null },
        status: { isLoading: true },
        actions: { loadQuiz: jest.fn() },
      })
      
      const { rerender } = render(<McqQuizPage params={{ slug: 'test-quiz' }} />)
      
      // Should show loading initially
      expect(screen.getByTestId('initializing-display')).toBeInTheDocument()
      
      // Then update to loaded state
      ;(useQuiz as jest.Mock).mockReturnValue({
        quiz: { 
          data: {
            id: 'quiz-123',
            title: 'Test Quiz',
            questions: [
              { id: 'q1', question: 'Test Question', options: ['A', 'B', 'C'], answer: 'A' }
            ]
          }
        },
        status: { isLoading: false },
        actions: { loadQuiz: jest.fn() },
      })
      
      rerender(<McqQuizPage params={{ slug: 'test-quiz' }} />)
      
      // Should transition to quiz wrapper
      expect(screen.getByTestId('mock-quiz-wrapper')).toBeInTheDocument()
    })
    
    it('handles authentication status changes', () => {
      // Start unauthenticated
      ;(useAuth as jest.Mock).mockReturnValue({
        userId: null,
        status: 'unauthenticated',
      })
      
      // Still provide quiz data
      ;(useQuiz as jest.Mock).mockReturnValue({
        quiz: { 
          data: {
            id: 'quiz-123',
            title: 'Test Quiz',
            questions: [
              { id: 'q1', question: 'Test Question', options: ['A', 'B', 'C'], answer: 'A' }
            ]
          }
        },
        status: { isLoading: false },
        actions: { loadQuiz: jest.fn() },
      })
      
      const { rerender } = render(<McqQuizPage params={{ slug: 'test-quiz' }} />)
      
      // Should still render quiz wrapper even when unauthenticated
      expect(screen.getByTestId('mock-quiz-wrapper')).toBeInTheDocument()
      
      // Now transition to authenticated state
      ;(useAuth as jest.Mock).mockReturnValue({
        userId: 'user123',
        status: 'authenticated',
      })
      
      rerender(<McqQuizPage params={{ slug: 'test-quiz' }} />)
      
      // Should still show quiz wrapper
      expect(screen.getByTestId('mock-quiz-wrapper')).toBeInTheDocument()
    })
  })
})
