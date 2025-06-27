import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
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

// Use Redux Toolkit's configureStore which automatically sets up the middleware
const createMockStore = (initialState = {}) => configureStore({
  reducer: (state = initialState) => state,
  preloadedState: initialState
})

const renderComponent = (initialState: any, props: any = {}) => {
  const store = createMockStore(initialState);
  return {
    ...render(
      <Provider store={store}>
        <GenericQuizResultHandler
          slug="example-slug"
          quizType="personality"
          {...props}
        >
          {({ result }) => <div data-testid="quiz-results">Results: {result?.score}</div>}
        </GenericQuizResultHandler>
      </Provider>
    ),
    store
  }
}

describe('GenericQuizResultHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  })
  // Edge Case 1: Auth loading + quiz loading → Loading screen
  it('shows loading screen when auth or quiz is loading', async () => {
    const initialState = {
      quiz: {
        results: null,
        status: 'loading',
        id: null,
        isCompleted: false,
        isProcessingResults: false,
      },
      _persist: { rehydrated: true }
    }

    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      login: mockLogin,
    })

    renderComponent(initialState)
    
    // Wait for the initializing phase to complete
    await waitFor(() => {
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })  // Edge Case 2: User not authenticated but has results → Sign In Prompt
  it('shows sign-in prompt if not authenticated but has results', async () => {
    const initialState = {
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
      _persist: { rehydrated: true }
    }

    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      login: mockLogin,
    })

    renderComponent(initialState)
    
    // Wait for the system to be ready
    await waitFor(() => {
      expect(screen.getByText(/sign in/i)).toBeInTheDocument()
      expect(screen.getByText(/retake/i)).toBeInTheDocument()
    })
  })
  // Edge Case 3: Authenticated with matching results → Show results
  it('shows quiz results if authenticated and has correct slug', async () => {
    const initialState = {
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
      _persist: { rehydrated: true }
    }

    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
    })

    renderComponent(initialState)
    
    // Wait for the system to be ready
    await waitFor(() => {
      expect(screen.getByTestId('quiz-results')).toHaveTextContent('Results: 9')
    })
  })
  // Edge Case 4: Authenticated but no results, not completed → No Results
  it('shows no results if not completed and no results exist', async () => {
    const initialState = {
      quiz: {
        results: null,
        status: 'idle',
        id: 'example-slug',
        isCompleted: false,
        isProcessingResults: false,
      },
      _persist: { rehydrated: true }
    }

    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
    })

    renderComponent(initialState)
    
    // Wait for the system to be ready
    await waitFor(() => {
      expect(screen.getByText(/quiz results not found/i)).toBeInTheDocument()
      expect(screen.getByText(/retake quiz/i)).toBeInTheDocument()
    })
  })
  // Edge Case 5: Results from another quiz (slug mismatch) → Loading
  it('should treat results with different slug as no results', async () => {
    const initialState = {
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
      _persist: { rehydrated: true }
    }

    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
    })

    renderComponent(initialState)
    
    // Wait for the system to be ready
    await waitFor(() => {
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })
  // Edge Case 6: Auth just finished, should dispatch restore
  it('does not dispatch restore twice after login', async () => {
    const dispatchMock = jest.fn()
    const initialState = {
      quiz: {
        results: null,
        status: 'idle',
        id: null,
        isCompleted: true,
        isProcessingResults: false,
      },
      _persist: { rehydrated: true }
    }
    
    const { store } = renderComponent(initialState)
    store.dispatch = dispatchMock

    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
    })

    // Wait for the system to be ready and dispatch to happen
    await waitFor(() => {
      expect(dispatchMock).toHaveBeenCalledTimes(1)
    }, { timeout: 3000 })
  })
  // Edge Case 7: Already has correct results, should NOT dispatch
  it('does not dispatch load if results already match', async () => {
    const dispatchMock = jest.fn()
    const initialState = {
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
      _persist: { rehydrated: true }
    }
    
    const { store } = renderComponent(initialState)
    store.dispatch = dispatchMock

    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
    })

    // Wait longer for the system to be ready and ensure dispatch isn't called
    await new Promise(resolve => setTimeout(resolve, 200));
    expect(dispatchMock).not.toHaveBeenCalled();
  })
  // Edge Case 8: Dispatch fires only once when loading needed
  it('dispatches load once if no results and quiz completed', async () => {
    const dispatchMock = jest.fn()
    const initialState = {
      quiz: {
        results: null,
        status: 'idle',
        id: null,
        isCompleted: true,
        isProcessingResults: false,
      },
      _persist: { rehydrated: true }
    }
    
    const { store } = renderComponent(initialState)
    store.dispatch = dispatchMock

    ;(useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
    })

    // Wait for the system to be ready and dispatch to happen
    await waitFor(() => {
      expect(dispatchMock).toHaveBeenCalledTimes(1)
    }, { timeout: 3000 })
  })
})
