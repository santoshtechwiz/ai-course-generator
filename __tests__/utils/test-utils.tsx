import { render, RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { ReactElement } from 'react'
import { quizSlice } from '@/store/slices/quiz/quiz-slice'
import { rootReducer } from '@/store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/theme-provider'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}))

// Create a custom render function that includes providers
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>
  store?: ReturnType<typeof configureStore>
  queryClient?: QueryClient
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: rootReducer,
      preloadedState,
    }),
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <SessionProvider session={null}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </SessionProvider>
        </QueryClientProvider>
      </Provider>
    )
  }

  return {
    store,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

// Test data factories
export const createMockQuiz = (overrides = {}) => ({
  id: 'test-quiz-1',
  slug: 'javascript-basics-test',
  title: 'JavaScript Basics Quiz',
  quizType: 'code' as const,
  questions: [
    {
      id: 'q1',
      question: 'What is the output of console.log(typeof null)?',
      type: 'code',
      options: ['null', 'object', 'undefined', 'boolean'],
      answer: 'object',
      codeSnippet: 'console.log(typeof null)',
      language: 'javascript',
    },
    {
      id: 'q2',
      question: 'Write a function to reverse a string',
      type: 'code',
      codeSnippet: 'function reverseString(str) {\n  // Your code here\n}',
      language: 'javascript',
      answer: 'function reverseString(str) {\n  return str.split("").reverse().join("");\n}',
    },
  ],
  ...overrides,
})

export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  image: null,
  ...overrides,
})

export const createMockSession = (user = createMockUser()) => ({
  user,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
})

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
})

// Mock fetch globally
export const mockFetch = (response: any = null) => {
  global.fetch = jest.fn(() =>
    Promise.resolve(mockApiResponse(response))
  ) as jest.MockedFunction<typeof fetch>
}

// Mock fetch with error
export const mockFetchError = (error: any = 'Network error') => {
  global.fetch = jest.fn(() => Promise.reject(error)) as jest.MockedFunction<typeof fetch>
}

// Mock fetch with specific status
export const mockFetchWithStatus = (data: any, status: number) => {
  global.fetch = jest.fn(() =>
    Promise.resolve(mockApiResponse(data, status))
  ) as jest.MockedFunction<typeof fetch>
}

// Utility to wait for Redux state changes
export const waitForState = (store: any, selector: (state: any) => any, expectedValue: any, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    const checkState = () => {
      const state = store.getState()
      const currentValue = selector(state)

      if (currentValue === expectedValue) {
        resolve(currentValue)
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for state. Expected: ${expectedValue}, Got: ${currentValue}`))
      } else {
        setTimeout(checkState, 10)
      }
    }

    checkState()
  })
}

// Clean up after each test
export const cleanup = () => {
  jest.clearAllMocks()
  jest.clearAllTimers()
}

// Type helpers
type RootState = ReturnType<typeof rootReducer>
