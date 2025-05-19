import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import OpenEndedQuizWrapper from '../components/OpenEndedQuizWrapper'
import { textQuizReducer } from '@/app/store/slices/textQuizSlice'
import type { OpenEndedQuizData } from '../types'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  })
}))

const mockQuizData = {
  id: '1',
  title: 'Test Quiz',
  questions: [
    {
      id: '1',
      question: 'Explain how hooks work in React.',
      answer: 'Hooks are functions that allow you to use state and other React features in functional components.',
    }
  ],
  slug: 'test-quiz'
}

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

  const submitQuizAnswer = async (answer: string) => {
    const textarea = screen.getByTestId('answer-textarea')
    const button = screen.getByTestId('submit-button')
    
    fireEvent.change(textarea, { target: { value: answer } })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(textarea).toHaveValue('')
    })
  }

  it('shows loading state initially', () => {
    render(
      <Provider store={mockStore}>
        <OpenEndedQuizWrapper quizData={null} slug="test" />
      </Provider>
    )
    expect(screen.getByText(/loading quiz/i)).toBeInTheDocument()
  })

  it('redirects to results when completing quiz', async () => {
    render(
      <Provider store={mockStore}>
        <OpenEndedQuizWrapper quizData={mockQuizData} slug="test" />
      </Provider>
    )

    await submitQuizAnswer('Hooks allow state in functional components')

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/openended/test/results')
      const state = mockStore.getState().textQuiz
      expect(state.isCompleted).toBe(true)
    }, { timeout: 3000 })
  })

  it('processes answers correctly', async () => {
    render(
      <Provider store={mockStore}>
        <OpenEndedQuizWrapper quizData={mockQuizData} slug="test" />
      </Provider>
    )

    const testAnswer = 'Hooks allow state management in functional components'
    await submitQuizAnswer(testAnswer)

    await waitFor(() => {
      const state = mockStore.getState().textQuiz
      expect(state.answers).toHaveLength(1)
      expect(state.answers[0].answer).toBe(testAnswer)
    }, { timeout: 3000 })
  })

  it('handles quiz completion flow', async () => {
    render(
      <Provider store={mockStore}>
        <OpenEndedQuizWrapper quizData={mockQuizData} slug="test" />
      </Provider>
    )

    await submitQuizAnswer('Complete answer')

    await waitFor(() => {
      const state = mockStore.getState().textQuiz
      expect(state.isCompleted).toBe(true)
      expect(state.currentQuestionIndex).toBe(0)
      expect(mockPush).toHaveBeenCalledWith('/dashboard/openended/test/results')
    }, { timeout: 3000 })
  })

  it('moves to next question after submission', async () => {
    const multiQuestionData: OpenEndedQuizData = {
      id: '1',
      title: 'Test Quiz',
      questions: [
        {
          id: '1',
          question: 'First question',
          answer: 'First answer',
        },
        {
          id: '2',
          question: 'Second question',
          answer: 'Second answer',
        }
      ],
      slug: 'test-quiz'
    }

    render(
      <Provider store={mockStore}>
        <OpenEndedQuizWrapper quizData={multiQuestionData} slug="test" />
      </Provider>
    )

    // Submit first answer
    await submitQuizAnswer('First answer')

    await waitFor(() => {
      const state = mockStore.getState().textQuiz
      expect(state.currentQuestionIndex).toBe(1)
      expect(screen.getByText(/Second question/)).toBeInTheDocument()
    })
  })
})
