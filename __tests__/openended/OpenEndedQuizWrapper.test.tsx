import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store'
import OpenEndedQuizWrapper from '@/app/dashboard/(quiz)/openended/components/OpenEndedQuizWrapper'
import type { TextQuizState, OpenEndedQuizData } from '@/types/quiz'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

jest.mock('@/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn()
}))

const mockQuizData: OpenEndedQuizData = {
  id: '1',
  title: 'Test Quiz',
  userId: 'user1',
  questions: [
    {
      id: 1,
      question: 'Test question 1?',
      answer: 'Test answer 1',
      openEndedQuestion: {
        hints: ['hint1', 'hint2'],
        difficulty: 'medium'
      }
    }
  ]
}

const mockQuizState: Partial<TextQuizState> = {
  quizId: '1',
  currentQuestionIndex: 0,
  answers: [
    {
      questionId: 1,
      question: 'Test question 1?',
      answer: 'test answer',
      correctAnswer: 'Test answer 1',
      timeSpent: 30,
      hintsUsed: false,
      index: 0
    }
  ],
  questions: mockQuizData.questions,
  status: 'succeeded'
}

describe('OpenEndedQuizWrapper', () => {
  const mockRouter = {
    replace: jest.fn(),
    push: jest.fn()
  }
  const mockDispatch = jest.fn(() => Promise.resolve())

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useAppDispatch as jest.Mock).mockReturnValue(mockDispatch)
  })

  it('should initialize quiz on mount', () => {
    render(<OpenEndedQuizWrapper slug="test-quiz" quizData={mockQuizData} />)
    
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'textQuiz/initializeQuiz',
      payload: expect.objectContaining({
        id: '1',
        type: 'openended',
        slug: 'test-quiz'
      })
    }))
  })

  it('should show loading state when no quiz data', () => {
    render(<OpenEndedQuizWrapper slug="test-quiz" quizData={null} />)
    
    expect(screen.getByText(/Loading your quiz questions/i)).toBeInTheDocument()
  })

  it('should navigate to results page on quiz completion', async () => {
    // Setup initial state
    const mockState = {
      ...mockQuizState,
      currentQuestionIndex: 0,
      answers: [{
        questionId: 1,
        question: 'Test question 1?',
        answer: 'test answer',
        correctAnswer: 'Test answer 1',
        timeSpent: 30,
        hintsUsed: false,
        index: 0
      }]
    }
    ;(useAppSelector as jest.Mock).mockReturnValue(mockState)

    // Mock dispatch to handle both initialize and complete actions
    let dispatchCallCount = 0
    mockDispatch.mockImplementation((action) => {
      dispatchCallCount++
      if (dispatchCallCount === 1) {
        // First call is initializeQuiz
        return Promise.resolve()
      }
      // Second call is completeQuiz
      return Promise.resolve()
    })

    render(<OpenEndedQuizWrapper slug="test-quiz" quizData={mockQuizData} />)

    const submitButton = screen.getByTestId('submit-button')
    await fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard/openended/test-quiz/results')
    })

    expect(mockDispatch).toHaveBeenCalledTimes(2)
    // Verify the last call was completeQuiz
    const lastCall = mockDispatch.mock.calls[1][0]
    expect(lastCall).toMatchObject({
      type: 'textQuiz/completeQuiz',
      payload: expect.objectContaining({
        answers: mockState.answers
      })
    })
  })

  it('should move to next question when not on last question', async () => {
    // Setup state with multiple questions
    const mockStateWithMultipleQuestions = {
      ...mockQuizState,
      currentQuestionIndex: 0,
      questions: [mockQuizData.questions[0], { ...mockQuizData.questions[0], id: 2 }]
    }
    ;(useAppSelector as jest.Mock).mockReturnValue(mockStateWithMultipleQuestions)

    // Mock dispatch to handle both initialize and setCurrentQuestion actions
    let dispatchCallCount = 0
    mockDispatch.mockImplementation((action) => {
      dispatchCallCount++
      if (dispatchCallCount === 1) {
        // First call is initializeQuiz
        return Promise.resolve()
      }
      // Second call is setCurrentQuestion
      return Promise.resolve()
    })

    render(<OpenEndedQuizWrapper slug="test-quiz" quizData={mockQuizData} />)

    const submitButton = screen.getByTestId('submit-button')
    await fireEvent.click(submitButton)

    await waitFor(() => {
      const lastCall = mockDispatch.mock.calls[1][0]
      expect(lastCall).toMatchObject({
        type: 'textQuiz/setCurrentQuestion',
        payload: 1
      })
    })
  })
})
