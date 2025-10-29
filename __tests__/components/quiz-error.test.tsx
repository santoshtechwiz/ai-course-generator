import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QuizError, QuizErrorType } from '@/components/quiz/QuizError'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>
  }
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon">AlertTriangle</div>,
  RefreshCw: () => <div data-testid="refresh-icon">RefreshCw</div>,
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
  MessageSquare: () => <div data-testid="message-square-icon">MessageSquare</div>,
  Home: () => <div data-testid="home-icon">Home</div>,
  Search: () => <div data-testid="search-icon">Search</div>
}))

describe('QuizError Component', () => {
  const mockProps = {
    onRetry: vi.fn(),
    onGoBack: vi.fn(),
    onReportIssue: vi.fn(),
    onGoHome: vi.fn(),
    quizType: 'code',
    quizSlug: 'test-quiz-123'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Error Type Configurations', () => {
    const errorTypes: QuizErrorType[] = [
      'NOT_FOUND',
      'PRIVATE_QUIZ',
      'SERVER_ERROR',
      'NETWORK_ERROR',
      'CANCELLED',
      'INVALID_QUIZ_TYPE',
      'MISSING_PARAMS',
      'UNKNOWN_ERROR'
    ]

    it.each(errorTypes)('renders correct content for %s error type', (errorType) => {
      render(<QuizError {...mockProps} errorType={errorType} />)

      // Check that the component renders without crashing
      expect(screen.getByRole('heading', { level: 1 })).to.exist
    })

    it('renders NOT_FOUND error with correct title and description', () => {
      render(<QuizError {...mockProps} errorType="NOT_FOUND" />)

      expect(screen.getByText('QUIZ NOT FOUND')).to.exist
      expect(screen.getByText('This quiz doesn\'t exist or has been removed. Check the URL or try searching for similar quizzes.')).to.exist
      expect(screen.getByTestId('search-icon')).to.exist
    })

    it('renders PRIVATE_QUIZ error with correct title and description', () => {
      render(<QuizError {...mockProps} errorType="PRIVATE_QUIZ" />)

      expect(screen.getByText('PRIVATE QUIZ')).to.exist
      expect(screen.getByText('This quiz is private and requires special access. Contact the quiz creator for permission.')).to.exist
      expect(screen.getByTestId('alert-triangle-icon')).to.exist
    })

    it('renders SERVER_ERROR error with correct title and description', () => {
      render(<QuizError {...mockProps} errorType="SERVER_ERROR" />)

      expect(screen.getByText('SERVER ERROR')).to.exist
      expect(screen.getByText('Our servers are having trouble right now. Please try again in a few minutes.')).to.exist
    })

    it('renders NETWORK_ERROR error with correct title and description', () => {
      render(<QuizError {...mockProps} errorType="NETWORK_ERROR" />)

      expect(screen.getByText('CONNECTION ISSUE')).to.exist
      expect(screen.getByText('Unable to connect to our servers. Check your internet connection and try again.')).to.exist
    })

    it('renders UNKNOWN_ERROR as default when no errorType provided', () => {
      render(<QuizError {...mockProps} />)

      expect(screen.getByText('SOMETHING WENT WRONG')).to.exist
      expect(screen.getByText('An unexpected error occurred while loading this quiz. Our team has been notified.')).to.exist
    })
  })

  describe('Custom Message', () => {
    it('uses custom message when provided', () => {
      const customMessage = 'Custom error message for testing'
      render(<QuizError {...mockProps} errorType="NOT_FOUND" message={customMessage} />)

      expect(screen.getByText(customMessage)).to.exist
      expect(screen.queryByText('This quiz doesn\'t exist or has been removed. Check the URL or try searching for similar quizzes.')).not.to.exist
    })
  })

  describe('Action Buttons', () => {
    describe('Retry Button', () => {
      it('shows retry button for errors that support it', () => {
        render(<QuizError {...mockProps} errorType="SERVER_ERROR" />)

        const retryButton = screen.getByText('TRY AGAIN')
        expect(retryButton).to.exist
        expect(screen.getByTestId('refresh-icon')).to.exist
      })

      it('calls onRetry when retry button is clicked', () => {
        render(<QuizError {...mockProps} errorType="SERVER_ERROR" />)

        const retryButton = screen.getByText('TRY AGAIN')
        fireEvent.click(retryButton)

        expect(mockProps.onRetry).toHaveBeenCalledTimes(1)
      })

      it('does not show retry button when onRetry is not provided', () => {
        render(<QuizError {...mockProps} errorType="SERVER_ERROR" onRetry={undefined} />)

        expect(screen.queryByText('TRY AGAIN')).not.to.exist
      })
    })

    describe('Go Back Button', () => {
      it('shows go back button for errors that support it', () => {
        render(<QuizError {...mockProps} errorType="PRIVATE_QUIZ" />)

        const backButton = screen.getByText('GO BACK')
        expect(backButton).to.exist
        expect(screen.getByTestId('arrow-left-icon')).to.exist
      })

      it('calls onGoBack when go back button is clicked', () => {
        render(<QuizError {...mockProps} errorType="PRIVATE_QUIZ" />)

        const backButton = screen.getByText('GO BACK')
        fireEvent.click(backButton)

        expect(mockProps.onGoBack).toHaveBeenCalledTimes(1)
      })
    })

    describe('Home Button', () => {
      it('shows home button for errors that support it', () => {
        render(<QuizError {...mockProps} errorType="NOT_FOUND" />)

        const homeButton = screen.getByText('HOME')
        expect(homeButton).to.exist
        expect(screen.getByTestId('home-icon')).to.exist
      })

      it('calls onGoHome when home button is clicked', () => {
        render(<QuizError {...mockProps} errorType="NOT_FOUND" />)

        const homeButton = screen.getByText('HOME')
        fireEvent.click(homeButton)

        expect(mockProps.onGoHome).toHaveBeenCalledTimes(1)
      })
    })

    describe('Report Issue Button', () => {
      it('shows report issue button for errors that support it', () => {
        render(<QuizError {...mockProps} errorType="SERVER_ERROR" />)

        const reportButton = screen.getByText('REPORT ISSUE')
        expect(reportButton).to.exist
        expect(screen.getByTestId('message-square-icon')).to.exist
      })

      it('calls onReportIssue when report issue button is clicked', () => {
        render(<QuizError {...mockProps} errorType="SERVER_ERROR" />)

        const reportButton = screen.getByText('REPORT ISSUE')
        fireEvent.click(reportButton)

        expect(mockProps.onReportIssue).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Context Information', () => {
    it('displays quiz type and slug when provided', () => {
      render(<QuizError {...mockProps} />)

      expect(screen.getByText(/Quiz Type: CODE/)).to.exist
      expect(screen.getByText(/ID: test-quiz-123/)).to.exist
    })

    it('only displays quiz type when slug is not provided', () => {
      render(<QuizError {...mockProps} quizSlug={undefined} />)

      expect(screen.getByText('Quiz Type: CODE')).to.exist
      expect(screen.queryByText('ID:')).not.to.exist
    })

    it('only displays quiz slug when type is not provided', () => {
      render(<QuizError {...mockProps} quizType={undefined} />)

      expect(screen.queryByText('Quiz Type:')).not.to.exist
      expect(screen.getByText('ID: test-quiz-123')).to.exist
    })

    it('does not display context section when neither type nor slug provided', () => {
      render(<QuizError {...mockProps} quizType={undefined} quizSlug={undefined} />)

      expect(screen.queryByText('Quiz Type:')).not.to.exist
      expect(screen.queryByText('ID:')).not.to.exist
    })
  })

  describe('Styling and Accessibility', () => {
    it('has correct CSS classes for brutalist design', () => {
      const { container } = render(<QuizError {...mockProps} errorType="NOT_FOUND" />)

      const mainDiv = container.firstChild as HTMLElement
      expect(mainDiv.className).to.include('w-full')
      expect(mainDiv.className).to.include('max-w-2xl')
      expect(mainDiv.className).to.include('bg-yellow-300')
      expect(mainDiv.className).to.include('border-8')
      expect(mainDiv.className).to.include('border-black')
    })

    it('has proper heading structure', () => {
      render(<QuizError {...mockProps} />)

      expect(screen.getByRole('heading', { level: 1 })).to.exist
    })
  })

  describe('Error Boundaries Integration', () => {
    it('handles undefined errorType gracefully', () => {
      render(<QuizError {...mockProps} errorType={undefined as any} />)

      expect(screen.getByText('SOMETHING WENT WRONG')).to.exist
    })

    it('handles invalid errorType gracefully', () => {
      render(<QuizError {...mockProps} errorType={'INVALID_TYPE' as any} />)

      expect(screen.getByText('SOMETHING WENT WRONG')).to.exist
    })
  })
})