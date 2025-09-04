/**
 * Quiz Flow Test Runner
 *
 * This file demonstrates how to run the quiz flow integration tests
 * and provides examples of the test utilities.
 */

import { renderWithProviders, createMockQuiz, createMockUser, mockFetch, cleanup } from './utils/test-utils'
import { CodeQuizWrapper } from '@/app/dashboard/(quiz)/code/components/CodeQuizWrapper'
import { screen, waitFor } from '@testing-library/react'

// Example of how to use the test utilities
describe('Quiz Flow Test Examples', () => {
  it('should demonstrate test utilities usage', async () => {
    const mockQuiz = createMockQuiz()
    const mockUser = createMockUser()

    // Mock successful API response
    mockFetch(mockQuiz)

    // Render component with providers
    const { store } = renderWithProviders(
      <CodeQuizWrapper slug={mockQuiz.slug} title={mockQuiz.title} />
    )

    // Wait for quiz to load
    await waitFor(() => {
      expect(screen.getByText(mockQuiz.title)).toBeInTheDocument()
    })

    // Verify Redux state
    expect(store.getState().quiz.title).toBe(mockQuiz.title)

    // Clean up
    cleanup()
  })
})

// Export test utilities for use in other test files
export * from './utils/test-utils'
