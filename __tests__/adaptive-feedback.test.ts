import { getAdaptiveFeedback } from '@/lib/utils/adaptive-feedback'

describe('adaptive feedback', () => {
  test('acceptable answer returns isAcceptable true', () => {
    const feedback = getAdaptiveFeedback({
      isAuthenticated: true,
      attemptCount: 1,
      userAnswer: '42',
      correctAnswer: '42',
      hints: []
    } as any)

    expect(feedback.isAcceptable).toBe(true)
  })

  test('guest never allows full reveal', () => {
    const feedback = getAdaptiveFeedback({
      isAuthenticated: false,
      attemptCount: 5,
      userAnswer: 'nope',
      correctAnswer: 'yes',
      hints: []
    } as any)

    expect(feedback.allowFullReveal).toBe(false)
  })
})
