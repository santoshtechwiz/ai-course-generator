import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import OpenEndedQuizWrapper from '@/app/dashboard/(quiz)/openended/components/OpenEndedQuizWrapper'
import type { TextQuizState, OpenEndedQuizData } from '@/types/quiz'
import { initializeQuiz, completeQuiz, setCurrentQuestion } from '@/app/store/slices/textQuizSlice'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    push: jest.fn()
  })
}))

// Mock React components used by OpenEndedQuizWrapper
jest.mock('@/app/dashboard/(quiz)/openended/components/OpenEndedQuizQuestion', () => {
  return function MockOpenEndedQuizQuestion(props: any) {
    return (
      <div data-testid="mock-quiz-question">
        <div>Question: {props.question.question}</div>
        <div>Number: {props.questionNumber}</div>
        <div>Total: {props.totalQuestions}</div>
        <button 
          data-testid="submit-button"
          onClick={props.onQuestionComplete}
        >
          Submit Answer
        </button>
      </div>
    )
  }
})

// Create mocks for store hooks
const mockDispatch = jest.fn()
const mockSelector = jest.fn()

// Mock store hooks
jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: () => mockSelector()
}))

// Create test data
const mockQuizData: OpenEndedQuizData = {
  id: '1',
  title: 'Test Quiz',
  userId: 'user1',
  questions: [
    {
      id: '1',
      question: 'Test question 1?',
      answer: 'Test answer 1',
      openEndedQuestion: {
        hints: ['hint1', 'hint2'],
        difficulty: 'medium'
      }
    },
    {
      id: '2',
      question: 'Test question 2?',
      answer: 'Test answer 2',
      openEndedQuestion: {
        hints: ['hint1', 'hint2'],
        difficulty: 'medium'
      }
    }
  ]
}

const mockQuizState: Partial<TextQuizState> = {
  quizData: mockQuizData,
  currentQuestionIndex: 0,
  answers: [],
  status: 'idle',
  isCompleted: false
}

describe('OpenEndedQuizWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default mock implementation
    mockSelector.mockReturnValue(mockQuizState)
  })

  it('should initialize quiz on mount', async () => {
    // Render component
    render(<OpenEndedQuizWrapper slug="test-quiz" quizData={mockQuizData} />)
    
    // Wait for initialization to complete
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('initialize')
        })
      )
    })
    
    // Verify initializeQuiz was called with correct params
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          id: '1',
          type: 'openended',
          slug: 'test-quiz'
        })
      })
    )
  })

  it('should show loading state when initializing', () => {
    render(<OpenEndedQuizWrapper slug="test-quiz" quizData={mockQuizData} />)
    
    // Check for loading message
    expect(screen.getByText(/initializing your quiz/i)).toBeInTheDocument()
  })

  it('should show error for invalid quiz data', async () => {
    // Set isInitializing to false for this test so we can see the error message
    jest.useFakeTimers()
    
    // Need to use a null that will pass the quizData?.id check but fail isValidQuizData
    const invalidQuizData = {
      id: '1',
      title: 'Invalid Quiz',
      questions: [] // Empty questions array will fail validation
    } as unknown as OpenEndedQuizData;
    
    render(<OpenEndedQuizWrapper slug="test-quiz" quizData={invalidQuizData} />)
    
    // Fast-forward past initialization
    jest.advanceTimersByTime(600)
    jest.useRealTimers()
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.queryByText(/initializing your quiz/i)).not.toBeInTheDocument()
    })
    
    // Check for the text that actually appears in the component
    expect(screen.getByText(/invalid quiz data/i, { exact: false })).toBeInTheDocument()
  })

  it('should navigate to results page on last question completion', async () => {
    // Setup mocks for last question
    mockSelector.mockReturnValue({
      ...mockQuizState,
      currentQuestionIndex: mockQuizData.questions.length - 1 // Last question
    })
    
    // Wait for initialization timeout to complete
    jest.useFakeTimers()
    render(<OpenEndedQuizWrapper slug="test-quiz" quizData={mockQuizData} />)
    
    // Fast-forward past initialization
    jest.advanceTimersByTime(600)
    jest.useRealTimers()
    
    // Now render should be complete and we should see the quiz question
    await waitFor(() => {
      expect(screen.queryByText(/initializing your quiz/i)).not.toBeInTheDocument()
    })
    
    // Find and click submit button
    const submitButton = await screen.findByTestId('submit-button')
    fireEvent.click(submitButton)
    
    // Check that completeQuiz was dispatched
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('completeQuiz')
        })
      )
    })
  })

  it('should move to next question when not on last question', async () => {
    // Setup mock for first question of multiple questions
    mockSelector.mockReturnValue({
      ...mockQuizState,
      currentQuestionIndex: 0,
      quizData: {
        ...mockQuizData,
        questions: mockQuizData.questions // Two questions
      }
    })
    
    // Wait for initialization timeout to complete
    jest.useFakeTimers()
    render(<OpenEndedQuizWrapper slug="test-quiz" quizData={mockQuizData} />)
    
    // Fast-forward past initialization
    jest.advanceTimersByTime(600)
    jest.useRealTimers()
    
    // Now render should be complete
    await waitFor(() => {
      expect(screen.queryByText(/initializing your quiz/i)).not.toBeInTheDocument()
    })
    
    // Find and click submit button
    const submitButton = await screen.findByTestId('submit-button')
    fireEvent.click(submitButton)
    
    // Check that setCurrentQuestion was dispatched with next question index
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('setCurrentQuestion'),
          payload: 1 // Next question index
        })
      )
    })
  })
})
