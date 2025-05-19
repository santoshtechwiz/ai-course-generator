import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import BlankQuizWrapper from '@/app/dashboard/(quiz)/blanks/components/BlankQuizWrapper'
import { textQuizReducer } from '@/app/store/slices/textQuizSlice'

const mockQuizData = {
  id: '1',
  title: 'Test Quiz',
  questions: [
    {
      id: '1',
      question: 'What is [[test]]?',
      answer: 'test',
    }
  ],
  slug: 'test-quiz'
}

// Mock the router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/dashboard/blanks/test-quiz',
  useParams: () => ({ slug: 'test-quiz' })
}))

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key],
    setItem: (key: string, value: string) => { store[key] = value },
    clear: () => { store = {} }
  };
})();

Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

describe('BlankQuizWrapper', () => {
  let mockStore: ReturnType<typeof configureStore>

  beforeEach(() => {
    mockStore = configureStore({
      reducer: {
        textQuiz: textQuizReducer
      }
    })
    mockPush.mockClear()
    sessionStorage.clear()
    jest.clearAllMocks()
  })

  const submitQuizAnswer = async (answer: string) => {
    const input = screen.getByTestId('answer-input')
    const button = screen.getByTestId('submit-button')
    
    fireEvent.change(input, { target: { value: answer } })
    fireEvent.click(button)
    
    // Wait for state updates
    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  }

  it('processes answers correctly', async () => {
    render(
      <Provider store={mockStore}>
        <BlankQuizWrapper quizData={mockQuizData} slug="test" />
      </Provider>
    )

    await submitQuizAnswer('test')

    await waitFor(() => {
      const state = mockStore.getState().textQuiz
      expect(state.answers).toHaveLength(1)
      expect(state.answers[0].answer).toBe('test')
      expect(state.answers[0].isCorrect).toBe(true)
    }, { timeout: 3000 })
  })

  it('restores quiz state from storage', async () => {
    // Setup stored state
    const storedState = {
      answers: [{
        questionId: '1',
        answer: 'test',
        isCorrect: true,
        timeSpent: 10,
        index: 0
      }],
      currentQuestionIndex: 0
    }

    sessionStorage.setItem('blanks_quiz_state_test', JSON.stringify(storedState))

    render(
      <Provider store={mockStore}>
        <BlankQuizWrapper quizData={mockQuizData} slug="test" />
      </Provider>
    )

    await waitFor(() => {
      const state = mockStore.getState().textQuiz
      expect(state.answers).toHaveLength(1)
      expect(state.answers[0].answer).toBe('test')
    }, { timeout: 3000 })
  })
})
