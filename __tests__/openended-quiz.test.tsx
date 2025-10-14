import React from 'react'
import { render, fireEvent, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Minimal mocks similar to blanks tests
vi.mock('@/components/quiz/AdaptiveFeedbackWrapper', () => ({
  AdaptiveFeedbackWrapper: ({ onReset, children }: any) => (
    <div>
      <button data-testid="adaptive-reset" onClick={() => onReset && onReset()}>
        Trigger Reset
      </button>
      {children}
    </div>
  ),
  useAdaptiveFeedback: () => ({})
}))

vi.mock('@/components/quiz/QuizContainer', () => ({
  QuizContainer: ({ children }: any) => <div data-testid="quiz-container">{children}</div>
}))

vi.mock('@/components/quiz/QuizFooter', () => ({
  QuizFooter: ({ onNext, onPrevious, onSubmit, nextLabel = 'Next' }: any) => (
    <div>
      <button data-testid="next-button" onClick={() => onNext && onNext()}>{nextLabel}</button>
    </div>
  )
}))

vi.mock('@/components/quiz/HintSystem', () => ({
  HintSystem: ({ hints, onHintUsed }: any) => (
    <div data-testid="hint-system">
      {Array.isArray(hints) && hints.map((h: any, i: number) => {
        const label = typeof h === 'string' ? h : (h && h.content) ? h.content : JSON.stringify(h)
        const meta = h && h.meta ? JSON.stringify(h.meta) : ''
        return (
          <button key={i} data-testid={`hint-${i}`} data-meta={meta} onClick={() => onHintUsed && onHintUsed(i)}>
            {label}
          </button>
        )
      })}
    </div>
  )
}))

vi.mock('@/modules/auth', () => ({ useAuth: () => ({ isAuthenticated: true }) }))

const similarityMock = vi.fn()
vi.mock('@/lib/utils/text-similarity', () => ({ calculateAnswerSimilarity: (...args: any[]) => similarityMock(...args) }))

// Ensure generateHints returns an empty array in tests so progressiveHints will append our 5-step template
vi.mock('@/lib/utils/hint-system-unified', () => ({ generateHints: (..._args: any[]) => [] }))

import OpenEndedQuiz from '@/app/dashboard/(quiz)/openended/components/OpenEndedQuiz'

describe('OpenEndedQuiz behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    similarityMock.mockReset()
  })
  afterEach(function() { vi.useRealTimers() })

  it('does not clear textarea on blur if user modified after deferred reset request', async () => {
    similarityMock.mockReturnValue({ similarity: 0.2, isAcceptable: false })
    const onAnswer = vi.fn(() => true)

    render(
      <OpenEndedQuiz
        question={{ id: 'oq1', question: 'Explain ___ briefly', answer: 'short answer' }}
        questionNumber={1}
        totalQuestions={1}
        existingAnswer={''}
        onAnswer={onAnswer}
      />
    )

    const ta = screen.getByLabelText('Enter your detailed answer') as HTMLTextAreaElement
    fireEvent.focus(ta)
    fireEvent.change(ta, { target: { value: 'initial' } })

    const trigger = screen.getByTestId('adaptive-reset')
    fireEvent.click(trigger)

    fireEvent.change(ta, { target: { value: 'modified' } })
    fireEvent.blur(ta)

    expect(ta.value).toBe('modified')
  })

  it('allows navigation to next when onAnswer returns undefined', async () => {
    similarityMock.mockReturnValue({ similarity: 0.7, isAcceptable: true })
    const onAnswer = vi.fn(() => undefined)
    const onNext = vi.fn()

    render(
      <OpenEndedQuiz
        question={{ id: 'oq2', question: 'Discuss ___', answer: 'expected' }}
        questionNumber={1}
        totalQuestions={2}
        existingAnswer={''}
        onAnswer={onAnswer as any}
        onNext={onNext}
      />
    )

    const ta = screen.getByLabelText('Enter your detailed answer') as HTMLTextAreaElement
    fireEvent.change(ta, { target: { value: 'expected' } })

    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    const next = screen.getByTestId('next-button')
    fireEvent.click(next)

    expect(onNext).toHaveBeenCalled()
  })

  it('provides progressive hints with meta data and a starter scaffold', async () => {
    // Setup a question with a known answer so we can predict meta values
    similarityMock.mockReturnValue({ similarity: 0.7, isAcceptable: true })

    const onAnswer = vi.fn(() => undefined)

    render(
      <OpenEndedQuiz
        question={{ id: 'oq3', question: 'What are OpenAI goals?', answer: 'The primary goals of OpenAI are to develop advanced AI systems that are safe, broadly beneficial, and accessible to as many people as possible.' }}
        questionNumber={1}
        totalQuestions={1}
        existingAnswer={''}
        onAnswer={onAnswer as any}
      />
    )

    // Advance any timers used by animations/hooks to ensure hints render
    await act(async () => {
      // run all pending timers so any delayed work completes
      vi.runAllTimers()
      // microtask tick
      await Promise.resolve()
    })

    // The HintSystem is mocked; grab the first visible hint button's label
    const hintButton = screen.getByTestId('hint-0')
    expect(hintButton).toBeTruthy()

    // Access the rendered hint element text to assert starter scaffold presence in one of the hints
    const hintText = hintButton.textContent || ''
    expect(hintText.length).toBeGreaterThan(0)

    // The progressive hints include a starter scaffold in one hint; check for the phrase 'The primary goals of OpenAI'
    const anyHintContainsStarter = Array.from(document.querySelectorAll('[data-testid^="hint-"]')).some((el) => el.textContent && el.textContent.includes('The primary goals of OpenAI'))
    expect(anyHintContainsStarter).toBe(true)
  })
})
