import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { useDispatch, useSelector } from 'react-redux'
import { useSessionService } from '@/hooks/useSessionService'
import McqResultsPage from './page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn((param) => (param === 'fromAuth' ? null : null))
  }))
}))

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ status: 'loading', data: null })),
  signIn: jest.fn()
}))

// Mock redux hooks
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(() => jest.fn()),
  useSelector: jest.fn((selector) => {
    if (selector.toString().includes('selectQuizResults')) return null
    if (selector.toString().includes('selectOrGenerateQuizResults')) return null
    if (selector.toString().includes('selectAnswers')) return {}
    if (selector.toString().includes('selectIsAuthenticated')) return false
    if (selector.toString().includes('selectQuizStatus')) return 'idle'
    return null
  })
}))

// Mock session service
jest.mock('@/hooks/useSessionService', () => ({
  useSessionService: jest.fn(() => ({
    saveAuthRedirectState: jest.fn(),
    restoreAuthRedirectState: jest.fn(),
    clearQuizResults: jest.fn()
  }))
}))

// Mock components
jest.mock('@/app/dashboard/(quiz)/components/QuizLoadingSteps', () => ({
  QuizLoadingSteps: jest.fn(() => <div data-testid="quiz-loading-steps">Loading Steps</div>)
}))

jest.mock('@/app/dashboard/(quiz)/components/NonAuthenticatedUserSignInPrompt', () => ({
  NonAuthenticatedUserSignInPrompt: jest.fn(({ onSignIn, handleRetake }) => (
    <div data-testid="unauthenticated-prompt">
      <button data-testid="sign-in-button" onClick={onSignIn}>Sign In</button>
      <button data-testid="retake-button" onClick={handleRetake}>Retake Quiz</button>
    </div>
  ))
}))

jest.mock('@/app/dashboard/(quiz)/components/QuizResult', () => ({
  default: jest.fn(({ onRetake }) => (
    <div data-testid="quiz-result">
      <button data-testid="retake-quiz-button" onClick={onRetake}>Retake Quiz</button>
    </div>
  ))
}))

// Mock session storage
const mockSessionStorage = (() => {
  let store = {}
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value
    }),
    removeItem: jest.fn((key) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    _getStore: () => store
  }
})()

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
})

describe('McqResultsPage', () => {
  const mockRouter = { push: jest.fn() }
  const mockDispatch = jest.fn()
  const mockParams = { slug: 'test-quiz' }
  
  const mockSessionService = {
    saveAuthRedirectState: jest.fn(),
    restoreAuthRedirectState: jest.fn(),
    clearQuizResults: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSessionStorage.clear()
    
    // Default mocks
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useDispatch as jest.Mock).mockReturnValue(mockDispatch)
    ;(useSessionService as jest.Mock).mockReturnValue(mockSessionService)
  })

  test('should render loading state when auth status is loading', () => {
    // Mock loading auth session
    ;(useSession as jest.Mock).mockReturnValue({ status: 'loading', data: null })
    ;(useSelector as jest.Mock).mockImplementation(() => null)

    render(<McqResultsPage params={{ slug: 'test-quiz' }} />)

    expect(screen.getByTestId('quiz-loading-steps')).toBeInTheDocument()
  })

  test('should redirect to quiz page when no results or answers are available', async () => {
    ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { name: 'Test User' } } })
    ;(useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes('selectQuizResults')) return null
      if (selector.toString().includes('selectAnswers')) return {}
      return null
    })
    
    render(<McqResultsPage params={mockParams} />)
    
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/mcq/test-quiz')
    })
  })

  test('should show sign-in prompt with limited results for unauthenticated users', () => {
    ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated', data: null })
    ;(useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes('selectQuizResults')) return { slug: 'test-quiz', score: 1, maxScore: 2, percentage: 50 }
      return null
    })
    
    render(<McqResultsPage params={mockParams} />)
    
    expect(screen.getByTestId('unauthenticated-prompt')).toBeInTheDocument()
  })

  test('should show full results for authenticated users', () => {
    ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { name: 'Test User' } } })
    ;(useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes('selectQuizResults')) return { slug: 'test-quiz', score: 1, maxScore: 2, percentage: 50 }
      return null
    })
    
    render(<McqResultsPage params={mockParams} />)
    
    expect(screen.getByTestId('quiz-result')).toBeInTheDocument()
  })

  test('should handle retake quiz action', async () => {
    ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { name: 'Test User' } } })
    ;(useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes('selectQuizResults')) return { slug: 'test-quiz', score: 1, maxScore: 1, percentage: 100 }
      return null
    })
    
    render(<McqResultsPage params={mockParams} />)
    
    const user = userEvent.setup()
    await act(async () => {
      await user.click(screen.getByTestId('retake-quiz-button'))
    })
    
    expect(mockSessionService.clearQuizResults).toHaveBeenCalled()
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/mcq/test-quiz?reset=true')
  })

  test('should handle sign-in action for unauthenticated users', async () => {
    ;(useSession as jest.Mock).mockReturnValue({ status: 'unauthenticated', data: null })
    ;(useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes('selectQuizResults')) return { slug: 'test-quiz', score: 1, maxScore: 2, percentage: 50 }
      return null
    })
    
    render(<McqResultsPage params={mockParams} />)
    
    const user = userEvent.setup()
    await act(async () => {
      await user.click(screen.getByTestId('sign-in-button'))
    })
    
    expect(mockSessionService.saveAuthRedirectState).toHaveBeenCalled()
    expect(signIn).toHaveBeenCalled()
  })

  test('should restore quiz state after authentication', async () => {
    mockSessionStorage.setItem('test-quiz_auth_for_results', 'true')
    ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { name: 'Test User' } } })
    ;(useSearchParams as jest.Mock).mockReturnValue({ get: jest.fn(() => 'true') })
    mockSessionService.restoreAuthRedirectState.mockReturnValue({
      returnPath: '/dashboard/mcq/test-quiz/results',
      quizState: { slug: 'test-quiz', currentState: { results: { slug: 'test-quiz', score: 1, maxScore: 2, percentage: 50 } } }
    })
    
    render(<McqResultsPage params={{ slug: 'test-quiz' }} />)
    
    expect(mockSessionService.restoreAuthRedirectState).toHaveBeenCalled()
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('test-quiz_auth_restored', 'true')
    expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('test-quiz_auth_for_results')
  })

  test('should use session storage results as fallback', () => {
    mockSessionStorage.setItem(`quiz_results_test-quiz`, JSON.stringify({ slug: 'test-quiz', score: 1, maxScore: 2, percentage: 50 }))
    ;(useSession as jest.Mock).mockReturnValue({ status: 'authenticated', data: { user: { name: 'Test User' } } })
    ;(useSelector as jest.Mock).mockImplementation(() => null)

    render(<McqResultsPage params={mockParams} />)
    expect(screen.getByTestId('quiz-result')).toBeInTheDocument()
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith(`quiz_results_test-quiz`)
  })
})
