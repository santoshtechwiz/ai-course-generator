
import React from 'react'
import { render, fireEvent, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mocks for modules used inside BlanksQuiz
vi.mock('@/components/quiz/AdaptiveFeedbackWrapper', () => {
  return {
    AdaptiveFeedbackWrapper: ({ onReset, children }: any) => (
      <div>
        <button data-testid="adaptive-reset" onClick={() => onReset && onReset()}>
          Trigger Reset
        </button>
        {children}
      </div>
    ),
    useAdaptiveFeedback: () => ({})
  }
})

// Mock QuizContainer to avoid rendering the real container (some files use `import type React` and
// thus lack a runtime React import which causes tests to crash). Keep structure minimal.
vi.mock('@/components/quiz/QuizContainer', () => ({
  QuizContainer: ({ children }: any) => <div data-testid="quiz-container">{children}</div>
}))

vi.mock('@/components/quiz/QuizFooter', () => ({
  QuizFooter: ({ onNext, onPrevious, onSubmit, nextLabel = 'Next' }: any) => (
    <div>
      <button data-testid="next-button" onClick={() => onNext && onNext()}>
        {nextLabel}
      </button>
    </div>
  )
}))

// Mock HintSystem to avoid rendering the real component (it imports React as type-only)
vi.mock('@/components/quiz/HintSystem', () => ({
  HintSystem: ({ hints, onHintUsed }: any) => (
    <div data-testid="hint-system">
      {Array.isArray(hints) && hints.slice(0, 1).map((h: any, i: number) => {
        const label = typeof h === 'string' ? h : (h && h.content) ? h.content : JSON.stringify(h)
        return (
          <button key={i} data-testid={`hint-${i}`} onClick={() => onHintUsed && onHintUsed(i)}>{label}</button>
        )
      })}
    </div>
  )
}))

// Mock auth hook to be consistent
vi.mock('@/modules/auth', () => ({
  useAuth: () => ({ isAuthenticated: true })
}))

// Mock calculateAnswerSimilarity so we can simulate both low/high similarity
const similarityMock = vi.fn()
vi.mock('@/lib/utils/text-similarity', () => ({
  calculateAnswerSimilarity: (...args: any[]) => similarityMock(...args)
}))

// Import component under test after mocks
import BlanksQuiz from '@/app/dashboard/(quiz)/blanks/components/BlanksQuiz'

describe('BlanksQuiz behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    similarityMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not clear input on blur if the user changed the input after deferred reset request', async () => {
    // similarity low so AdaptiveFeedbackWrapper appears and onReset path is used
    similarityMock.mockReturnValue({ similarity: 0.2, isAcceptable: false })

    const onAnswer = vi.fn(() => true)

    render(
      <BlanksQuiz
        question={{ id: 'q1', question: 'Hello ______ world', answer: 'planet' }}
        questionNumber={1}
        totalQuestions={1}
        existingAnswer={''}
        onAnswer={onAnswer}
      />
    )

    const input = screen.getByLabelText('Answer input field') as HTMLInputElement
    // focus and type initial value
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'first' } })

    // trigger deferred reset from AdaptiveFeedbackWrapper
    const trigger = screen.getByTestId('adaptive-reset')
    fireEvent.click(trigger)

    // Now change the input (user types more) before blur
    fireEvent.change(input, { target: { value: 'modified' } })

    // blur
    fireEvent.blur(input)

    // value should still be the modified value
    expect(input.value).toBe('modified')
  })

  it('allows navigation to next when onAnswer returns undefined', async () => {
    // Set similarity high so submission allowed
    similarityMock.mockReturnValue({ similarity: 0.8, isAcceptable: true })

    const onAnswer = vi.fn(() => undefined) // intentionally does not return boolean
    const onNext = vi.fn()

    render(
      <BlanksQuiz
        question={{ id: 'q2', question: 'Fill _____', answer: 'x' }}
        questionNumber={1}
        totalQuestions={2}
        existingAnswer={''}
        onAnswer={onAnswer}
        onNext={onNext}
      />
    )

    const input = screen.getByLabelText('Answer input field') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'x' } })

    // advance debounce timer so similarity is applied
    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    // Click next (QuizFooter is mocked to call onNext)
    const next = screen.getByTestId('next-button')
    fireEvent.click(next)

    // onNext should be called despite onAnswer returning undefined
    expect(onNext).toHaveBeenCalled()
  })
})
