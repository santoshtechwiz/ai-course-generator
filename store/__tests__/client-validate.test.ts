import { describe, it, expect } from 'vitest'

function validateQuizArray(items: any[], expectedCount: number) {
  const errors: string[] = []
  const warnings: string[] = []

  if (!Array.isArray(items)) {
    errors.push('Response is not an array.')
    return { valid: false, errors, warnings }
  }

  if (items.length === 0) {
    errors.push('No questions were returned by the AI.')
  }

  if (expectedCount && items.length !== expectedCount) {
    warnings.push(`Requested ${expectedCount} questions but received ${items.length}.`)
  }

  items.forEach((q: any, i: number) => {
    if (!q || typeof q !== 'object') {
      errors.push(`Item at index ${i} is not an object.`)
      return
    }
    if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
      errors.push(`Question at index ${i} is missing text.`)
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      errors.push(`Question at index ${i} must have at least 2 options.`)
    } else {
      q.options.forEach((opt: any, oi: number) => {
        if (typeof opt !== 'string') errors.push(`Option ${oi} for question ${i} is not a string.`)
      })
    }
    if (q.correctAnswer == null) {
      warnings.push(`Question at index ${i} has no explicit correctAnswer. Defaulting to 0.`)
    } else if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || (Array.isArray(q.options) && q.correctAnswer >= q.options.length)) {
      errors.push(`correctAnswer for question ${i} is invalid.`)
    }
  })

  return { valid: errors.length === 0, errors, warnings }
}

describe('client validateQuizArray', () => {
  it('validates a well-formed array', () => {
    const input = [
      { question: 'Q1', options: ['a', 'b'], correctAnswer: 0 },
      { question: 'Q2', options: ['x', 'y'], correctAnswer: 1 },
    ]
    const res = validateQuizArray(input, 2)
    expect(res.valid).toBe(true)
    expect(res.errors.length).toBe(0)
  })

  it('flags missing correctAnswer with warning', () => {
    const input = [{ question: 'Q1', options: ['a', 'b'] }]
    const res = validateQuizArray(input, 1)
    expect(res.valid).toBe(true)
    expect(res.warnings.length).toBeGreaterThan(0)
  })

  it('reports errors for invalid shapes', () => {
    const input = [{ question: '', options: ['a'] }, 'not an object']
    const res = validateQuizArray(input as any, 2)
    expect(res.valid).toBe(false)
    expect(res.errors.length).toBeGreaterThan(0)
  })
})
