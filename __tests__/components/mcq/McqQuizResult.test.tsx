import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react' // Import from react instead of react-dom/test-utils
import McqQuizResult from '@/app/dashboard/(quiz)/mcq/components/McqQuizResult'
import { QuizResult } from '@/app/types/quiz-types'
import { useRouter } from 'next/navigation'

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

// Mock QuizSubmissionLoading component
jest.mock('@/app/dashboard/(quiz)/components/QuizSubmissionLoading', () => ({
  QuizSubmissionLoading: jest.fn().mockImplementation(() => (
    <div data-testid="quiz-submission-loading">Loading Quiz Results...</div>
  ))
}))

// Add mock for any other required modules if needed
jest.mock('@/store/middleware/persistQuizMiddleware', () => ({
  clearAuthRedirectState: jest.fn(),
  loadAuthRedirectState: jest.fn(),
  saveAuthRedirectState: jest.fn(),
  hasAuthRedirectState: jest.fn().mockReturnValue(false)
}))

describe('McqQuizResult Component', () => {
  const mockPush = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    // Default router mock
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    })
  })
  
  afterEach(() => {
    jest.useRealTimers()
  })
  
  const mockResult: QuizResult = {
    id: 'result-id',
    slug: 'test-mcq-quiz',
    title: 'Test MCQ Quiz',
    score: 7,
    maxScore: 10,
    completedAt: '2023-05-01T12:00:00Z',
    questions: [
      {
        id: 'q1',
        question: 'What is 2+2?',
        userAnswer: '4',
        correctAnswer: '4',
        isCorrect: true
      },
      {
        id: 'q2',
        question: 'What is the capital of France?',
        userAnswer: 'London',
        correctAnswer: 'Paris',
        isCorrect: false
      }
    ]
  }
  
  test('should display loading state initially', () => {
    render(<McqQuizResult result={mockResult} />)
    
    // Should show loading component
    expect(screen.getByTestId('quiz-submission-loading')).toBeInTheDocument()
  })
  
  test('should display error state with invalid result data', () => {
    render(<McqQuizResult result={null as any} />)
    
    // Wait for loading to complete
    act(() => {
      jest.advanceTimersByTime(1100)
    })
    
    // Should show error message
    expect(screen.getByTestId('results-error')).toBeInTheDocument()
    
    // Simulate click on the return button
    const button = screen.getByRole('button', { name: 'Return to Quizzes' })
    act(() => {
      button.click()
    })
    
    // Verify router was called
    expect(mockPush).toHaveBeenCalledWith('/dashboard/quizzes')
  })
  
  test('should display quiz results after loading', () => {
    render(<McqQuizResult result={mockResult} />)
    
    // Wait for loading to complete
    act(() => {
      jest.advanceTimersByTime(1100)
    })
    
    // Should display the quiz result component
    expect(screen.getByTestId('mcq-quiz-result')).toBeInTheDocument()
    
    // Should show the correct quiz title
    expect(screen.getByText('Test MCQ Quiz')).toBeInTheDocument()
    
    // Should display the score
    expect(screen.getByText('7 / 10')).toBeInTheDocument()
    
    // Should display the percentage
    expect(screen.getByTestId('score-percentage')).toHaveTextContent('70% Score')
    
    // Should display correct number of question results
    expect(screen.getAllByTestId(/question-result-\d+/)).toHaveLength(2)
    
    // First question (correct answer)
    const question1 = screen.getByTestId('question-result-0')
    expect(question1).toHaveTextContent('What is 2+2?')
    expect(question1).toHaveTextContent('Your answer: 4')
    expect(question1).not.toHaveTextContent('Correct answer:') // No need to show correct answer if user was correct
    
    // Second question (incorrect answer)
    const question2 = screen.getByTestId('question-result-1')
    expect(question2).toHaveTextContent('What is the capital of France?')
    expect(question2).toHaveTextContent('Your answer: London')
    expect(question2).toHaveTextContent('Correct answer: Paris')
  })
  
  test('should navigate when buttons are clicked', () => {
    render(<McqQuizResult result={mockResult} />)
    
    // Wait for loading to complete
    act(() => {
      jest.advanceTimersByTime(1100)
    })
    
    // Click retry quiz button
    act(() => {
      screen.getByTestId('retry-quiz-button').click()
    })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/mcq/test-mcq-quiz')
    
    mockPush.mockClear()
    
    // Click return to dashboard button
    act(() => {
      screen.getByTestId('return-dashboard-button').click()
    })
    expect(mockPush).toHaveBeenCalledWith('/dashboard/quizzes')
  })
  
  test('should handle results with incomplete data', () => {
    const incompleteResult = {
      ...mockResult,
      questions: [
        {
          id: 'q1',
          question: '',
          userAnswer: undefined,
          correctAnswer: undefined,
          isCorrect: false
        }
      ]
    }
    
    render(<McqQuizResult result={incompleteResult} />)
    
    // Wait for loading to complete
    act(() => {
      jest.advanceTimersByTime(1100)
    })
    
    // Should still render without crashing
    expect(screen.getByTestId('mcq-quiz-result')).toBeInTheDocument()
    
    // Should display placeholder text for missing data
    const questionResult = screen.getByTestId('question-result-0')
    expect(questionResult).toHaveTextContent('Unknown question')
    expect(questionResult).toHaveTextContent('No answer provided')
    expect(questionResult).toHaveTextContent('Correct answer: Unknown')
  })
})
