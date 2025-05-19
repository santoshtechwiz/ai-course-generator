import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { quizReducer } from '@/app/store/slices/quizSlice'
import McqQuizWrapper from '@/app/dashboard/(quiz)/mcq/components/McqQuizWrapper'

// Test mock data
const mockQuizData = {
  id: '1',
  title: 'Test MCQ Quiz',
  questions: [
    {
      id: '1',
      question: 'What is the capital of France?',
      options: ['Paris', 'London', 'Madrid', 'Rome'],
      correctAnswer: 'Paris',
      type: 'mcq'
    }
  ],
  slug: 'test-mcq-quiz',
  type: 'mcq'
}

// Mock the router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/dashboard/mcq/test-mcq-quiz',
  useParams: () => ({ slug: 'test-mcq-quiz' })
}))

// Mock the quiz submission API endpoints
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })
) as jest.Mock;

describe('McqQuizWrapper', () => {
  let mockStore: ReturnType<typeof configureStore>

  beforeEach(() => {
    mockStore = configureStore({
      reducer: {
        quiz: quizReducer
      }
    })
    mockPush.mockClear()
    jest.clearAllMocks()
  })

  it('renders the MCQ quiz properly', () => {
    render(
      <Provider store={mockStore}>
        <McqQuizWrapper 
          quizData={mockQuizData} 
          slug="test-mcq-quiz"
          quizId="1" 
        />
      </Provider>
    )
    
    expect(screen.getByText('Test MCQ Quiz')).toBeInTheDocument()
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
  })
  
  it('handles answer submission correctly', async () => {
    render(
      <Provider store={mockStore}>
        <McqQuizWrapper 
          quizData={mockQuizData} 
          slug="test-mcq-quiz"
          quizId="1" 
        />
      </Provider>
    )
    
    // Find and click the correct answer option
    const correctOption = screen.getByText('Paris')
    fireEvent.click(correctOption)
    
    // Wait for state updates
    await waitFor(() => {
      const state = mockStore.getState().quiz
      expect(state.answers).toHaveLength(1)
      expect(state.answers[0].isCorrect).toBe(true)
    })
  })
})
