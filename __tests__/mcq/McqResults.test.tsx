import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import ResultsPage from '@/app/dashboard/(quiz)/mcq/[slug]/results/page'
import { useAuth } from '@/hooks/useAuth'
import { useQuiz } from '@/hooks'

// Mock the necessary hooks and components
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn().mockReturnValue({ slug: 'test-slug' })
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}))

jest.mock('@/hooks', () => ({
  useQuiz: jest.fn()
}))

// Add mock for store/middleware/persistQuizMiddleware
jest.mock('@/store/middleware/persistQuizMiddleware', () => ({
  clearAuthRedirectState: jest.fn(),
  loadAuthRedirectState: jest.fn(),
  saveAuthRedirectState: jest.fn(),
  hasAuthRedirectState: jest.fn().mockReturnValue(false)
}))

// Mock child components
jest.mock('@/app/dashboard/(quiz)/mcq/components/McqQuizResult', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ result }) => (
    <div data-testid="mcq-quiz-result-mock">
      Result: {result.score}/{result.maxScore}
    </div>
  ))
}))

jest.mock('@/app/dashboard/(quiz)/components/NonAuthenticatedUserSignInPrompt', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ onSignIn, message }) => (
    <div data-testid="sign-in-prompt-mock" onClick={onSignIn}>
      {message}
    </div>
  ))
}))

jest.mock('@/app/dashboard/(quiz)/components/QuizStateDisplay', () => ({
  InitializingDisplay: jest.fn().mockImplementation(() => (
    <div data-testid="initializing-display-mock">Loading...</div>
  )),
  ErrorDisplay: jest.fn().mockImplementation(({ error, onRetry }) => (
    <div data-testid="error-display-mock" onClick={onRetry}>
      Error: {error}
    </div>
  ))
}))

// Mock the use function
const mockUse = jest.fn().mockImplementation(() => {
  return 'test-slug'
})

// Replace React's use with our mock
jest.mock('react', () => {
  const originalModule = jest.requireActual('react')
  return {
    ...originalModule,
    use: () => mockUse()
  }
})

describe('MCQ Quiz Results Page', () => {
  // Setup common mocks
  const mockPush = jest.fn()
  const mockRequireAuth = jest.fn()
  const mockGetResults = jest.fn().mockReturnValue(Promise.resolve())
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default router mock
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  test('should show sign in prompt when user is not authenticated', () => {
    // Mock auth hook to return not authenticated
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      status: 'unauthenticated',
      requireAuth: mockRequireAuth
    })
    
    // Mock quiz hook with empty data
    ;(useQuiz as jest.Mock).mockReturnValue({
      quiz: { data: null },
      results: null,
      status: { isLoading: false, errorMessage: null },
      actions: { getResults: mockGetResults }
    })
    
    render(<ResultsPage params={Promise.resolve('test-slug')} />)
    
    // Check if sign in prompt is displayed
    expect(screen.getByTestId('sign-in-prompt-mock')).toBeInTheDocument()
    
    // Simulate sign in click
    screen.getByTestId('sign-in-prompt-mock').click()
    expect(mockRequireAuth).toHaveBeenCalledWith('/dashboard/mcq/test-slug/results')
  })
  
  test('should show loading state while authentication is pending', () => {
    // Mock auth hook to return loading state
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      status: 'loading'
    })
    
    // Mock quiz hook
    ;(useQuiz as jest.Mock).mockReturnValue({
      quiz: { data: null },
      results: null,
      status: { isLoading: false, errorMessage: null },
      actions: { getResults: mockGetResults }
    })
    
    render(<ResultsPage params={Promise.resolve('test-slug')} />)
    
    // Check if loading component is displayed
    expect(screen.getByTestId('initializing-display-mock')).toBeInTheDocument()
  })
  
  test('should show loading state while quiz results are loading', () => {
    // Mock auth hook
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      status: 'authenticated'
    })
    
    // Mock quiz hook with loading state
    ;(useQuiz as jest.Mock).mockReturnValue({
      quiz: { data: null },
      results: null,
      status: { isLoading: true, errorMessage: null },
      actions: { getResults: mockGetResults }
    })
    
    render(<ResultsPage params={Promise.resolve('test-slug')} />)
    
    // Check if loading component is displayed
    expect(screen.getByTestId('initializing-display-mock')).toBeInTheDocument()
  })
  
  test('should show error state when results fetch fails', () => {
    const errorMessage = 'Failed to load quiz results'
    
    // Mock auth hook
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      status: 'authenticated'
    })
    
    // Mock quiz hook with error
    ;(useQuiz as jest.Mock).mockReturnValue({
      quiz: { data: null },
      results: null,
      status: { isLoading: false, errorMessage },
      actions: { getResults: mockGetResults }
    })
    
    render(<ResultsPage params={Promise.resolve('test-slug')} />)
    
    // Check if error component is displayed with the correct message
    expect(screen.getByTestId('error-display-mock')).toBeInTheDocument()
    expect(screen.getByTestId('error-display-mock')).toHaveTextContent(errorMessage)
    
    // Test retry functionality
    screen.getByTestId('error-display-mock').click()
    expect(mockGetResults).toHaveBeenCalledWith('test-slug')
  })
  
  test('should show "No Results Found" when authenticated but no results available', () => {
    // Mock auth hook
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      status: 'authenticated'
    })
    
    // Mock quiz hook with no results
    ;(useQuiz as jest.Mock).mockReturnValue({
      quiz: { data: null },
      results: null,
      status: { isLoading: false, errorMessage: null },
      actions: { getResults: mockGetResults }
    })
    
    render(<ResultsPage params={Promise.resolve('test-slug')} />)
    
    // Check if "No Results Found" message is displayed
    expect(screen.getByText('No Results Found')).toBeInTheDocument()
    
    // Test "Take the Quiz" button functionality
    screen.getByText('Take the Quiz').click()
    expect(mockPush).toHaveBeenCalledWith('/dashboard/mcq/test-slug')
  })
  
  test('should display quiz results when authenticated and results are available', () => {
    // Mock quiz results
    const mockResults = {
      id: 'result-id',
      slug: 'test-slug',
      title: 'Test Quiz',
      score: 8,
      maxScore: 10,
      questions: [
        {
          id: 'q1',
          question: 'Test Question 1',
          userAnswer: 'Answer 1',
          correctAnswer: 'Answer 1',
          isCorrect: true
        }
      ],
      completedAt: '2023-05-01T12:00:00Z'
    }
    
    // Mock auth hook
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      status: 'authenticated'
    })
    
    // Mock quiz hook with results
    ;(useQuiz as jest.Mock).mockReturnValue({
      quiz: { data: null },
      results: mockResults,
      status: { isLoading: false, errorMessage: null },
      actions: { getResults: mockGetResults }
    })
    
    render(<ResultsPage params={Promise.resolve('test-slug')} />)
    
    // Check if results component is displayed with the correct data
    expect(screen.getByTestId('mcq-quiz-result-mock')).toBeInTheDocument()
    expect(screen.getByTestId('mcq-quiz-result-mock')).toHaveTextContent('Result: 8/10')
  })
  
  test('should fetch results when authenticated and no results are available', async () => {
    // Mock auth hook
    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      status: 'authenticated'
    })
    
    // Mock quiz hook with no results initially
    ;(useQuiz as jest.Mock).mockReturnValue({
      quiz: { data: null },
      results: null,
      status: { isLoading: false, errorMessage: null },
      actions: { getResults: mockGetResults }
    })
    
    render(<ResultsPage params={Promise.resolve('test-slug')} />)
    
    // Check if getResults was called with the correct slug
    await waitFor(() => {
      expect(mockGetResults).toHaveBeenCalledWith('test-slug')
    })
  })
})
