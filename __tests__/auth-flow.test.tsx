import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import NonAuthenticatedUserSignInPrompt from '@/app/dashboard/(quiz)/components/NonAuthenticatedUserSignInPrompt'
import McqResultsPage from '@/app/dashboard/(quiz)/mcq/[slug]/results/page'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock useQuiz hook
jest.mock('@/hooks/useQuizState', () => ({
  useQuiz: jest.fn().mockReturnValue({
    quiz: { data: null },
    status: { isLoading: false },
    actions: { getResults: jest.fn() },
    results: null,
    tempResults: null,
  }),
}))

// Mock React.use
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    use: jest.fn(value => value instanceof Promise ? { slug: 'test-quiz' } : value),
  };
})

describe('Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const mockRouter = { push: jest.fn() }
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('NonAuthenticatedUserSignInPrompt', () => {
    it('redirects to sign in with correct callback URL', async () => {
      // Setup mock for unauthenticated state
      ;(useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        status: 'unauthenticated',
      })

      render(<NonAuthenticatedUserSignInPrompt quizType="mcq" />)

      // Find and click the sign in button
      const signInButton = screen.getByText('Sign in to Continue')
      fireEvent.click(signInButton)

      // Verify signIn was called with correct callback
      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('google', {
          callbackUrl: '/dashboard/mcq',
        })
      })
    })

    it('uses custom return path when provided', async () => {
      // Setup mock for unauthenticated state
      ;(useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        status: 'unauthenticated',
      })

      const customPath = '/dashboard/mcq/test-quiz/results'
      render(<NonAuthenticatedUserSignInPrompt quizType="mcq" returnPath={customPath} />)

      // Find and click the sign in button
      const signInButton = screen.getByText('Sign in to Continue')
      fireEvent.click(signInButton)

      // Verify signIn was called with custom callback
      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('google', {
          callbackUrl: customPath,
        })
      })
    })

    it('displays score preview when provided', () => {
      // Setup mock for unauthenticated state
      ;(useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        status: 'unauthenticated',
      })

      const previewData = {
        score: 8,
        maxScore: 10,
        percentage: 80,
      }

      render(<NonAuthenticatedUserSignInPrompt quizType="mcq" previewData={previewData} />)

      // Verify preview is displayed
      expect(screen.getByText('80%')).toBeInTheDocument()
      expect(screen.getByText('Your Score: 8 / 10')).toBeInTheDocument()
    })
  })

  describe('Results Page Authentication', () => {
    it('shows sign in prompt for unauthenticated users', () => {
      // Setup mock for unauthenticated state
      ;(useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        status: 'unauthenticated',
        requireAuth: jest.fn(),
      })

      render(<McqResultsPage params={{ slug: 'test-quiz' }} />)

      // Verify sign in prompt is shown
      expect(screen.getByText('Sign in to Continue')).toBeInTheDocument()
    })

    it('attempts to load results for authenticated users', () => {
      // Setup mock for authenticated state
      ;(useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        status: 'authenticated',
        requireAuth: jest.fn(),
      })

      // Mock useQuiz to simulate results loading in progress
      jest.requireMock('@/hooks/useQuizState').useQuiz.mockReturnValue({
        quiz: { data: null },
        status: { isLoading: true },
        actions: { 
          getResults: jest.fn().mockImplementation(() => Promise.resolve({})) 
        },
        results: null,
        tempResults: null,
      })

      render(<McqResultsPage params={{ slug: 'test-quiz' }} />)

      // Verify loading state is shown
      expect(screen.getByText('Loading your quiz results...')).toBeInTheDocument()
    })
  })
})
