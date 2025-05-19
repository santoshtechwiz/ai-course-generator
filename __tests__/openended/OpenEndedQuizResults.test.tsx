import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAppSelector } from '@/store'
import OpenEndedQuizResultsPage from '@/app/dashboard/(quiz)/openended/[slug]/results/page'
import type { TextQuizState } from '@/types/quiz'

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}))

jest.mock('@/store', () => ({
  useAppSelector: jest.fn()
}))

// Mock quiz state
const mockQuizState: Partial<TextQuizState> = {
  quizId: 'test-quiz',
  title: 'Test Quiz',
  questions: [
    {
      id: 1,
      question: 'Test Question 1',
      answer: 'Expected Answer 1'
    }
  ],
  answers: [
    {
      questionId: 1,
      question: 'Test Question 1',
      answer: 'User Answer 1',
      correctAnswer: 'Expected Answer 1',
      timeSpent: 30,
      hintsUsed: false,
      index: 0
    }
  ],
  currentQuestionIndex: 0,
  status: 'succeeded',
  startTime: Date.now() - 1000,
  completedAt: new Date().toISOString()
}

describe('OpenEndedQuizResultsPage', () => {
  const mockRouter = {
    replace: jest.fn(),
    push: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAppSelector as jest.Mock).mockReturnValue(mockQuizState)
  })

  it('should redirect to dashboard if no quiz data', () => {
    ;(useAppSelector as jest.Mock).mockReturnValue({ ...mockQuizState, quizId: null })
    ;(useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true })

    render(<OpenEndedQuizResultsPage params={{ slug: 'test-quiz' }} />)
    
    expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/quizzes')
  })

  it('should show sign in prompt for non-authenticated users', () => {
    ;(useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false })

    render(<OpenEndedQuizResultsPage params={{ slug: 'test-quiz' }} />)

    expect(screen.getByTestId('non-authenticated-prompt')).toBeInTheDocument()
    expect(screen.getByText(/Sign in to save your results/i)).toBeInTheDocument()
  })

  it('should display quiz results for authenticated users', () => {
    ;(useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true })

    render(<OpenEndedQuizResultsPage params={{ slug: 'test-quiz' }} />)

    // Check for result content
    expect(screen.getByText(/Quiz Results/i)).toBeInTheDocument()
    expect(screen.getByText('Test Question 1')).toBeInTheDocument()
    expect(screen.getByText('User Answer 1')).toBeInTheDocument()
  })

  it('should handle restart quiz', () => {
    ;(useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true })

    render(<OpenEndedQuizResultsPage params={{ slug: 'test-quiz' }} />)

    const restartButton = screen.getByRole('button', { name: /Try Again/i })
    fireEvent.click(restartButton)

    expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/openended/test-quiz?reset=true')
  })
})
