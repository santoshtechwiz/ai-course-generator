import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { Action, configureStore } from '@reduxjs/toolkit'
import CodeQuizWrapper from '@/app/dashboard/(quiz)/code/components/CodeQuizWrapper'

// Test mock data
const mockQuizData = {
  id: '1',
  title: 'Test Code Quiz',
  questions: [
    {
      id: '1',
      question: 'Write a function that returns the sum of two numbers',
      answer: 'function sum(a, b) { return a + b; }',
      options: ['function sum(a, b) { return a + b; }', 'function sum(a, b) { return a - b; }'],
      language: 'javascript',
      codeSnippet: '// Write your code here'
    }
  ],
  slug: 'test-code-quiz',
  type: 'code'
}

// Mock the router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/dashboard/code/test-code-quiz',
  useParams: () => ({ slug: 'test-code-quiz' })
}))

// Mock the quiz submission API endpoints
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })
) as jest.Mock;

describe('CodeQuizWrapper', () => {
  let mockStore: ReturnType<typeof configureStore>

  beforeEach(() => {
    mockStore = configureStore({
      reducer: {
        quiz: quizReducer
      }
    })
    mockPush.mockClear()
    sessionStorage.clear()
    jest.clearAllMocks()
  })

  it('renders the code quiz properly', () => {
    render(
      <Provider store={mockStore}>
        <CodeQuizWrapper 
          quizData={mockQuizData} 
          slug="test-code-quiz"
          quizId="1" 
        />
      </Provider>
    )
    
    expect(screen.getByText('Test Code Quiz')).toBeInTheDocument()
    expect(screen.getByText('Write a function that returns the sum of two numbers')).toBeInTheDocument()
  })
})

