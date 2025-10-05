/**
 * Unit Tests for QuizResultHandler
 * 
 * Tests the critical flow of:
 * 1. Unauthenticated user submits quiz → temp results stored
 * 2. User signs in and returns → temp results loaded and saved to DB
 * 3. Results displayed after successful save
 * 
 * This test covers the bug where results weren't loading after user returns from sign-in.
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { describe, test, expect, beforeEach, vi } from 'vitest'
import QuizResultHandler from '@/app/dashboard/(quiz)/components/QuizResultHandler'
import { useAuth } from '@/modules/auth'
import { storageManager } from '@/utils/storage-manager'
import quizReducer from '@/store/slices/quiz/quiz-slice'

// Mock dependencies
vi.mock('@/modules/auth')
vi.mock('@/utils/storage-manager')
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>
const mockStorageManager = storageManager as any

describe('QuizResultHandler - Sign-in Flow Bug', () => {
  let store: ReturnType<typeof configureStore>

  const mockTempResults = {
    slug: 'test-quiz',
    savedAt: Date.now(),
    results: {
      slug: 'test-quiz',
      score: 8,
      maxScore: 10,
      percentage: 80,
      answers: [
        {
          questionId: '1',
          userAnswer: 'Option A',
          isCorrect: true,
          timeSpent: 5,
        },
      ],
      results: [
        {
          questionId: '1',
          userAnswer: 'Option A',
          correctAnswer: 'Option A',
          isCorrect: true,
        },
      ],
      totalTime: 120,
      submittedAt: new Date().toISOString(),
    },
  }

  beforeEach(() => {
    // Reset store for each test
    store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      preloadedState: {
        quiz: {
          currentQuestionIndex: 0,
          answers: {},
          results: null,
          isCompleted: false,
          status: 'succeeded',
          error: null,
          requiresAuth: false,
          redirectAfterLogin: null,
          userId: null,
          questionStartTimes: {},
          lastUpdated: Date.now(),
          isInitialized: true,
          pendingRedirect: false,
        },
      },
    })

    // Reset mocks
    vi.clearAllMocks()
    mockStorageManager.getTempQuizResults = vi.fn()
    mockStorageManager.clearTempQuizResults = vi.fn()
  })

  test('BUG FIX: loads temp results when user returns from sign-in', async () => {
    // SCENARIO: User submitted quiz while unauthenticated, then signed in

    // Step 1: Initial render - user is not authenticated, temp results exist
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    } as any)

    mockStorageManager.getTempQuizResults.mockReturnValue(mockTempResults)

    const { rerender } = render(
      <Provider store={store}>
        <QuizResultHandler slug="test-quiz" quizType="mcq">
          {({ result }) => <div>Results: {result?.percentage}%</div>}
        </QuizResultHandler>
      </Provider>
    )

    // Should show sign-in prompt with temp results
    await waitFor(() => {
      const state = store.getState().quiz
      expect(state.results).toBeTruthy()
      expect(state.results?.percentage).toBe(80)
    })

    // Step 2: User signs in and returns - simulate auth state change
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user-123', email: 'test@example.com' },
    } as any)

    // Mock the API call that saves temp results
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        result: mockTempResults.results,
      }),
    })

    // Rerender with authenticated state
    await act(async () => {
      rerender(
        <Provider store={store}>
          <QuizResultHandler slug="test-quiz" quizType="mcq">
            {({ result }) => <div>Results: {result?.percentage}%</div>}
          </QuizResultHandler>
        </Provider>
      )
    })

    // Step 3: Verify temp results are loaded and saved
    await waitFor(
      () => {
        // Verify getTempQuizResults was called again after auth change
        expect(mockStorageManager.getTempQuizResults).toHaveBeenCalledWith('test-quiz', 'mcq')

        // Verify API was called to save results
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/quizzes/mcq/test-quiz/submit'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )

        // Verify results are still in state
        const state = store.getState().quiz
        expect(state.results).toBeTruthy()
        expect(state.results?.percentage).toBe(80)
      },
      { timeout: 3000 }
    )
  })

  test('handles expired temp results gracefully', async () => {
    // Temp results older than 24 hours
    mockStorageManager.getTempQuizResults.mockReturnValue(null)

    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    } as any)

    render(
      <Provider store={store}>
        <QuizResultHandler slug="test-quiz" quizType="mcq">
          {({ result }) => <div>Results: {result?.percentage}%</div>}
        </QuizResultHandler>
      </Provider>
    )

    await waitFor(() => {
      // Should attempt to redirect to quiz since no valid temp results
      expect(mockStorageManager.getTempQuizResults).toHaveBeenCalled()
    })
  })

  test('handles API failure when saving temp results', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user-123' },
    } as any)

    mockStorageManager.getTempQuizResults.mockReturnValue(mockTempResults)

    // Mock API failure
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    })

    render(
      <Provider store={store}>
        <QuizResultHandler slug="test-quiz" quizType="mcq">
          {({ result }) => <div>Results: {result?.percentage}%</div>}
        </QuizResultHandler>
      </Provider>
    )

    await waitFor(() => {
      // Should show error state but NOT clear temp results
      expect(mockStorageManager.clearTempQuizResults).not.toHaveBeenCalled()
    })
  })

  test('clears temp results after successful save', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user-123' },
    } as any)

    mockStorageManager.getTempQuizResults.mockReturnValue(mockTempResults)

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, result: mockTempResults.results }),
    })

    render(
      <Provider store={store}>
        <QuizResultHandler slug="test-quiz" quizType="mcq">
          {({ result }) => <div>Results: {result?.percentage}%</div>}
        </QuizResultHandler>
      </Provider>
    )

    await waitFor(() => {
      // Temp results should be cleared after successful save
      expect(mockStorageManager.clearTempQuizResults).toHaveBeenCalledWith('test-quiz', 'mcq')
    })
  })

  test('does not reload results multiple times', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user-123' },
    } as any)

    mockStorageManager.getTempQuizResults.mockReturnValue(mockTempResults)

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, result: mockTempResults.results }),
    })

    const { rerender } = render(
      <Provider store={store}>
        <QuizResultHandler slug="test-quiz" quizType="mcq">
          {({ result }) => <div>Results: {result?.percentage}%</div>}
        </QuizResultHandler>
      </Provider>
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    // Rerender without state change
    rerender(
      <Provider store={store}>
        <QuizResultHandler slug="test-quiz" quizType="mcq">
          {({ result }) => <div>Results: {result?.percentage}%</div>}
        </QuizResultHandler>
      </Provider>
    )

    // Should not call API again
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  test('handles mismatched quiz slug correctly', async () => {
    // Store has results for different quiz
    store = configureStore({
      reducer: {
        quiz: quizReducer,
      },
      preloadedState: {
        quiz: {
          currentQuestionIndex: 0,
          answers: {},
          results: {
            slug: 'different-quiz',
            score: 5,
            maxScore: 10,
            percentage: 50,
          },
          isCompleted: true,
          status: 'succeeded',
          error: null,
          requiresAuth: false,
          redirectAfterLogin: null,
          userId: 'user-123',
          questionStartTimes: {},
          lastUpdated: Date.now(),
          isInitialized: true,
          pendingRedirect: false,
        },
      },
    })

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user-123' },
    } as any)

    mockStorageManager.getTempQuizResults.mockReturnValue(null)

    render(
      <Provider store={store}>
        <QuizResultHandler slug="test-quiz" quizType="mcq">
          {({ result }) => <div>Results: {result?.percentage}%</div>}
        </QuizResultHandler>
      </Provider>
    )

    await waitFor(() => {
      // Should clear mismatched results
      const state = store.getState().quiz
      expect(state.results).toBeNull()
    })
  })

  test('shows loading state during authentication check', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true, // Still checking auth
      user: null,
    } as any)

    mockStorageManager.getTempQuizResults.mockReturnValue(mockTempResults)

    render(
      <Provider store={store}>
        <QuizResultHandler slug="test-quiz" quizType="mcq">
          {({ result }) => <div>Results: {result?.percentage}%</div>}
        </QuizResultHandler>
      </Provider>
    )

    // Should not process results while auth is loading
    await waitFor(() => {
      expect(mockStorageManager.getTempQuizResults).not.toHaveBeenCalled()
    })
  })

  test('authenticated user without temp results loads from API', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'user-123' },
    } as any)

    mockStorageManager.getTempQuizResults.mockReturnValue(null)

    // Mock API to return saved results
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          slug: 'test-quiz',
          score: 9,
          maxScore: 10,
          percentage: 90,
        },
      }),
    })

    render(
      <Provider store={store}>
        <QuizResultHandler slug="test-quiz" quizType="mcq">
          {({ result }) => <div>Results: {result?.percentage}%</div>}
        </QuizResultHandler>
      </Provider>
    )

    await waitFor(() => {
      // Should load from API
      expect(global.fetch).toHaveBeenCalled()
    })
  })
})
