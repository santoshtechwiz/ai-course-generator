import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { textQuizReducer } from '@/app/store/slices/textQuizSlice'
import OpenEndedQuizWrapper from '@/app/dashboard/(quiz)/openended/components/OpenEndedQuizWrapper'

// Test mock data
const mockQuizData = {
  id: '1',
  title: 'Test Open-Ended Quiz',
  questions: [
    {
      id: '1',
      question: 'Explain the concept of recursion.',
      modelAnswer: 'Recursion is a programming concept where a function calls itself to solve a problem.',
      type: 'openended'
    }
  ],
  slug: 'test-openended-quiz',
  type: 'openended'
}

// Mock the router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/dashboard/openended/test-openended-quiz',
  useParams: () => ({ slug: 'test-openended-quiz' })
}))

// Mock the API endpoints
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ 
      success: true,
      result: {
        similarity: 0.85,
        isCorrect: true
      }
    }),
  })
) as jest.Mock;

describe('OpenEndedQuizWrapper', () => {
  let mockStore: ReturnType<typeof configureStore>

  beforeEach(() => {
    mockStore = configureStore({
      reducer: {
        textQuiz: textQuizReducer
      }
    })
    mockPush.mockClear()
    jest.clearAllMocks()
  })

  it('renders the open-ended quiz properly', () => {
    render(
      <Provider store={mockStore}>
        <OpenEndedQuizWrapper 
          quizData={mockQuizData} 
          slug="test-openended-quiz" 
        />
      </Provider>
    )
    
    expect(screen.getByText('Test Open-Ended Quiz')).toBeInTheDocument()
    expect(screen.getByText('Explain the concept of recursion.')).toBeInTheDocument()
  })
  
  it('handles answer submission', async () => {
    render(
      <Provider store={mockStore}>
        <OpenEndedQuizWrapper 
          quizData={mockQuizData} 
          slug="test-openended-quiz" 
        />
      </Provider>
    )
    
    // Find the textarea and submit button
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Recursion is when a function calls itself.' } })
    
    const submitButton = screen.getByRole('button', { name: /submit|continue/i })
    fireEvent.click(submitButton)
    
    // Wait for state updates
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })
})
