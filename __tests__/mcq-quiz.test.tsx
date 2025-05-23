import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '@/store'
import { toast } from 'sonner'
import McqQuiz from '@/app/dashboard/(quiz)/mcq/components/McqQuiz'
import McqQuizWrapper from '@/app/dashboard/(quiz)/mcq/components/McqQuizWrapper'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn().mockReturnValue(null)
}))

jest.mock('@/store', () => ({
  useAppDispatch: jest.fn()
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn()
  }
}))

// Mock useQuiz hook
jest.mock('@/hooks/useQuizState', () => ({
  useQuiz: jest.fn().mockReturnValue({
    actions: {
      saveTempResults: jest.fn()
    },
    status: { isLoading: false }
  })
}))

// Sample quiz data for testing
const testQuizData = {
  id: "quiz-123",
  title: "JavaScript Fundamentals",
  slug: "javascript-fundamentals",
  questions: [
    {
      id: "q1",
      question: "What is JavaScript?",
      options: ["A programming language", "A markup language", "A database"],
      answer: "A programming language",
      type: "mcq"
    },
    {
      id: "q2",
      question: "Which keyword is used to declare variables in JavaScript?",
      options: ["var", "let", "const", "All of the above"],
      answer: "All of the above",
      type: "mcq"
    }
  ]
}

describe('MCQ Quiz Components', () => {
  const mockRouter = { push: jest.fn() }
  const mockDispatch = jest.fn()
  const mockOnAnswer = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAppDispatch as jest.Mock).mockReturnValue(mockDispatch)
    jest.useFakeTimers()
  })
  
  afterEach(() => {
    jest.useRealTimers()
  })
  
  describe('McqQuiz Component', () => {
    it('renders the question and options correctly', () => {
      render(
        <McqQuiz
          question={testQuizData.questions[0]}
          onAnswer={mockOnAnswer}
          questionNumber={1}
          totalQuestions={2}
          isLastQuestion={false}
        />
      )
      
      expect(screen.getByTestId('question-text')).toHaveTextContent('What is JavaScript?')
      expect(screen.getByText('A programming language')).toBeInTheDocument()
      expect(screen.getByText('A markup language')).toBeInTheDocument()
      expect(screen.getByText('A database')).toBeInTheDocument()
    })
    
    it('handles selecting an option', () => {
      render(
        <McqQuiz
          question={testQuizData.questions[0]}
          onAnswer={mockOnAnswer}
          questionNumber={1}
          totalQuestions={2}
          isLastQuestion={false}
        />
      )
      
      const option = screen.getByText('A programming language').closest('div[data-testid^="option-"]')
      fireEvent.click(option)
      
      // Verify option is selected with appropriate styling
      expect(option.className).toContain('bg-primary/5')
    })
    
    it('calls onAnswer with correct parameters', () => {
      render(
        <McqQuiz
          question={testQuizData.questions[0]}
          onAnswer={mockOnAnswer}
          questionNumber={1}
          totalQuestions={2}
          isLastQuestion={false}
        />
      )
      
      // Select option
      fireEvent.click(screen.getByText('A programming language').closest('div[data-testid^="option-"]'))
      
      // Submit answer
      fireEvent.click(screen.getByTestId('submit-answer'))
      
      // Check onAnswer was called
      expect(mockOnAnswer).toHaveBeenCalledWith(
        'A programming language', 
        expect.any(Number), 
        true // this is correct answer
      )
    })
    
    it('shows "Submit Quiz" text for last question', () => {
      render(
        <McqQuiz
          question={testQuizData.questions[1]}
          onAnswer={mockOnAnswer}
          questionNumber={2}
          totalQuestions={2}
          isLastQuestion={true}
        />
      )
      
      expect(screen.getByTestId('submit-answer')).toHaveTextContent('Submit Quiz')
    })
  })
  
  describe('McqQuizWrapper Component', () => {
    it('handles quiz progression correctly', async () => {
      render(
        <McqQuizWrapper
          quizData={testQuizData}
          slug="javascript-fundamentals"
          quizId="quiz-123"
        />
      )
      
      // Answer first question
      fireEvent.click(screen.getByText('A programming language').closest('div[data-testid^="option-"]'))
      fireEvent.click(screen.getByTestId('submit-answer'))
      
      // Wait for state update and next question
      await act(async () => {
        jest.advanceTimersByTime(500)
      })
      
      // Verify dispatched to Redux
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'quiz/setUserAnswer'
      }))
      
      // Verify second question is shown after transition
      expect(screen.getByTestId('question-text')).toHaveTextContent('Which keyword is used to declare variables in JavaScript?')
    })
    
    it('handles quiz completion correctly', async () => {
      // Mock required for navigation upon completion
      const saveTempResults = jest.fn()
      jest.requireMock('@/hooks/useQuizState').useQuiz.mockReturnValue({
        actions: { saveTempResults },
        status: { isLoading: false }
      })
      
      render(
        <McqQuizWrapper
          quizData={{
            ...testQuizData,
            questions: [testQuizData.questions[0]] // Only one question for easier testing
          }}
          slug="javascript-fundamentals"
          quizId="quiz-123"
        />
      )
      
      // Answer the only question (which is also the last question)
      fireEvent.click(screen.getByText('A programming language').closest('div[data-testid^="option-"]'))
      fireEvent.click(screen.getByTestId('submit-answer'))
      
      // Wait for submission and completion process
      await act(async () => {
        jest.advanceTimersByTime(1000)
      })
      
      // Verify dispatched quiz submission action
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: 'quiz/submitQuiz'
      }))
      
      // Verify temp results saved
      expect(saveTempResults).toHaveBeenCalled()
      
      // Verify navigation to results page
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          '/dashboard/mcq/javascript-fundamentals/results'
        )
      })
      
      // Verify success toast was shown
      expect(toast.success).toHaveBeenCalledWith('Quiz completed!')
    })
    
    it('handles errors gracefully', async () => {
      // Mock dispatch to throw an error
      ;(useAppDispatch as jest.Mock).mockReturnValue(() => {
        throw new Error('Test error')
      })
      
      render(
        <McqQuizWrapper
          quizData={testQuizData}
          slug="javascript-fundamentals"
          quizId="quiz-123"
        />
      )
      
      // Answer the question
      fireEvent.click(screen.getByText('A programming language').closest('div[data-testid^="option-"]'))
      fireEvent.click(screen.getByTestId('submit-answer'))
      
      // Wait for error handling
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
      })
    })
    
    it('displays error for quiz with no questions', () => {
      render(
        <McqQuizWrapper
          quizData={{...testQuizData, questions: []}}
          slug="javascript-fundamentals"
          quizId="quiz-123"
        />
      )
      
      expect(screen.getByText(/This quiz has no questions/i)).toBeInTheDocument()
    })
  })
})
