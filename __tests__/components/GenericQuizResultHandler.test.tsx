import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import configureStore from 'redux-mock-store'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'
import { applyMiddleware } from 'redux'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import GenericQuizResultHandler from '@/app/dashboard/(quiz)/components/QuizResultHandler'

// Mocks
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}))
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockPush = jest.fn()
const mockLogin = jest.fn()

// For Redux 5+, ensure thunk is properly initialized
const mockStore = configureStore()

const renderComponent = (store: any, props: any = {}) => {
  return render(
    <Provider store={store}>
      <GenericQuizResultHandler
        slug="example-slug"
        quizType="personality"
        {...props}
      >
        {({ result }) => <div data-testid="quiz-results">Results: {result?.score}</div>}
      </GenericQuizResultHandler>
    </Provider>
  )
}

describe('GenericQuizResultHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  })

  // Edge Case 1: Auth loading + quiz loading → Loading screen
  it('shows loading screen when auth or quiz is loading', () => {
    const store = mockStore({
      quiz: {
        results: null,
        status: 'loading',
        id: null,
        isCompleted: false,
        isProcessingResults: false,
      },
    })

    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      login: mockLogin,
    })

    renderComponent(store)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  // Edge Case 2: User not authenticated but has results → Sign In Prompt
  it('shows sign-in prompt if not authenticated but has results', () => {
    const store = mockStore({
      quiz: {
        results: {
          slug: 'example-slug',
          percentage: 85,
          score: 17,
          maxScore: 20,
        },
        status: 'idle',
        id: 'example-slug',
        isCompleted: true,
        isProcessingResults: false,
      },
    })

    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
    })

    renderComponent(store)
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    expect(screen.getByText(/retake/i)).toBeInTheDocument()
  })

  // Edge Case 3: Authenticated with matching results → Show results
  it('shows quiz results if authenticated and has correct slug', () => {
    const store = mockStore({
      quiz: {
        results: {
          slug: 'example-slug',
          percentage: 90,
          score: 9,
          maxScore: 10,
        },
        status: 'idle',
        id: 'example-slug',
        isCompleted: true,
        isProcessingResults: false,
      },
    })

    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
    })

    renderComponent(store)
    expect(screen.getByTestId('quiz-results')).toHaveTextContent('Results: 9')
  })

  // Edge Case 4: Authenticated but no results, not completed → No Results
  it('shows no results if not completed and no results exist', () => {
    const store = mockStore({
      quiz: {
        results: null,
        status: 'idle',
        id: 'example-slug',
        isCompleted: false,
        isProcessingResults: false,
      },
    })

    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
    })

    renderComponent(store)
    expect(screen.getByText(/quiz results not found/i)).toBeInTheDocument()
    expect(screen.getByText(/retake quiz/i)).toBeInTheDocument()
  })

  // Edge Case 5: Results from another quiz (slug mismatch) → Loading
  it('should treat results with different slug as no results', () => {
    const store = mockStore({
      quiz: {
        results: {
          slug: 'other-slug',
          percentage: 100,
          score: 10,
          maxScore: 10,
        },
        status: 'idle',
        id: 'other-slug',
        isCompleted: true,
        isProcessingResults: false,
      },
    })

    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
    })

    renderComponent(store)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  // Edge Case 6: Auth just finished, should dispatch restore
  it('does not dispatch restore twice after login', async () => {
    const dispatchMock = jest.fn()
    const store = mockStore({
      quiz: {
        results: null,
        status: 'idle',
        id: null,
        isCompleted: true,
        isProcessingResults: false,
      },
    })
    store.dispatch = dispatchMock

    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
    })

    await act(async () => {
      renderComponent(store)
    })

    await waitFor(() => {
      expect(dispatchMock).toHaveBeenCalledTimes(1)
    })
  })

  // Edge Case 7: Already has correct results, should NOT dispatch
  it('does not dispatch load if results already match', async () => {
    const dispatchMock = jest.fn()
    const store = mockStore({
      quiz: {
        results: {
          slug: 'example-slug',
          score: 10,
        },
        status: 'idle',
        id: 'example-slug',
        isCompleted: true,
        isProcessingResults: false,
      },
    })
    store.dispatch = dispatchMock

    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
    })

    await act(async () => {
      renderComponent(store)
    })

    await waitFor(() => {
      expect(dispatchMock).not.toHaveBeenCalled()
    })
  })

  // Edge Case 8: Dispatch fires only once when loading needed
  it('dispatches load once if no results and quiz completed', async () => {
    const dispatchMock = jest.fn()
    const store = mockStore({
      quiz: {
        results: null,
        status: 'idle',
        id: null,
        isCompleted: true,
        isProcessingResults: false,
      },
    })
    store.dispatch = dispatchMock

    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
    })

    await act(async () => {
      renderComponent(store)
    })

    await waitFor(() => {
      expect(dispatchMock).toHaveBeenCalledTimes(1)
    })
  })
})
