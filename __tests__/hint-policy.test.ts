import { maskWord, maskSentence, maskForLevel } from '@/lib/utils/hint-policy'

describe('hint-policy masking', () => {
  test('maskWord hides letters after revealFirst', () => {
    expect(maskWord('answer', 1)).toBe('a_____')
    expect(maskWord('a', 1)).toBe('a')
  })

  test('maskSentence masks words correctly', () => {
    expect(maskSentence('hello world', 0)).toBe('_____ _____')
    expect(maskSentence('one two three', 1)).toMatch(/one \w+ \w+/)
  })

  test('maskForLevel applies levels', () => {
    expect(maskForLevel('singleword', 'low')).toContain('_')
    expect(maskForLevel('two words', 'medium')).toContain(' ')
  })
})
