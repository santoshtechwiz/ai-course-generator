import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useQuiz } from '@/hooks/useQuizState'
import McqResultsPage from './page'
import McqQuizResult from '../../components/McqQuizResult'

// Mock React.use
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    use: jest.fn(value => value instanceof Promise ? { slug: 'test-quiz' } : value),
  };
});

// Mock the necessary hooks and components
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}))

jest.mock('@/hooks/useQuizState', () => ({
  useQuiz: jest.fn()
}))

jest.mock('../../components/McqQuizResult', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="mock-quiz-result">Quiz Result Component</div>)
}))

jest.mock('../../../components/NonAuthenticatedUserSignInPrompt', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="mock-signin-prompt">Sign In Prompt</div>)
}))

jest.mock('../../../components/QuizStateDisplay', () => ({
  LoadingDisplay: jest.fn(() => <div data-testid="mock-loading">Loading...</div>),
  ErrorDisplay: jest.fn(() => <div data-testid="mock-error">Error</div>)
}))

describe('McqResultsPage', () => {
  const mockParams = { slug: 'test-quiz' }
  const mockRouter = { push: jest.fn() }
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementations
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      status: 'authenticated',
      requireAuth: jest.fn()
    })
    ;(useQuiz as jest.Mock).mockReturnValue({
      quiz: null,
      results: null,
      status: { isLoading: false },
      actions: {
        getResults: jest.fn().mockResolvedValue({}),
        saveResults: jest.fn().mockResolvedValue({})
      }
    })
  })

  test('shows loading state when fetching results', () => {
    ;(useQuiz as jest.Mock).mockReturnValue({
      quiz: null,
      results: null,
      status: { isLoading: true },
      actions: { getResults: jest.fn() }
    })

    render(<McqResultsPage params={mockParams} />)
    expect(screen.getByTestId('mock-loading')).toBeInTheDocument()
  })

  test('shows sign in prompt for unauthenticated users', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      status: 'unauthenticated',
      requireAuth: jest.fn()
    })

    render(<McqResultsPage params={mockParams} />)
    expect(screen.getByTestId('mock-signin-prompt')).toBeInTheDocument()
  })

  test('shows saved results when available', async () => {
    const mockResults = {
      score: 80,
      totalQuestions: 10,
      questionsAnswered: 10,
      correctAnswers: 8
    }
    
    ;(useQuiz as jest.Mock).mockReturnValue({
      quiz: null,
      results: mockResults,
      status: { isLoading: false },
      actions: { getResults: jest.fn() }
    })

    render(<McqResultsPage params={mockParams} />)
    
    expect(screen.getByTestId('mock-quiz-result')).toBeInTheDocument()
    expect(McqQuizResult).toHaveBeenCalledWith({ result: mockResults }, {})
  })

  test('shows temporary results with save button after quiz completion', async () => {
    const mockTempResults = {
      score: 70,
      totalQuestions: 10,
      questionsAnswered: 10,
      correctAnswers: 7
    }
    
    const mockSaveResults = jest.fn().mockResolvedValue({})
    
    ;(useQuiz as jest.Mock).mockReturnValue({
      quiz: null,
      results: null,
      tempResults: mockTempResults,
      status: { isLoading: false },
      actions: {
        getResults: jest.fn(),
        saveResults: mockSaveResults
      }
    })

    render(<McqResultsPage params={mockParams} />)
    
    // Should show the quiz results component
    expect(screen.getByTestId('mock-quiz-result')).toBeInTheDocument()
    
    // Should have the save button
    const saveButton = screen.getByText('Save Results to Your Account')
    expect(saveButton).toBeInTheDocument()
    
    // Test saving functionality
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(mockSaveResults).toHaveBeenCalledWith('test-quiz', mockTempResults)
    })
  })

  test('shows error message when results loading fails', async () => {
    ;(useQuiz as jest.Mock).mockReturnValue({
      quiz: null,
      results: null,
      status: { isLoading: false, errorMessage: 'Failed to load results' },
      actions: {
        getResults: jest.fn().mockRejectedValue(new Error('API error'))
      }
    })

    render(<McqResultsPage params={mockParams} />)
    
    expect(screen.getByTestId('mock-error')).toBeInTheDocument()
  })
})
