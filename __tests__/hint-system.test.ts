/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { generateHints, selectAdaptiveHint } from '@/lib/utils/hint-system-unified'

describe('Hint System - Unified', () => {
  describe('generateHints', () => {
    it('should always show character count hint first', () => {
      const hints = generateHints('indexing', 'The process is called _______', {
        tags: [],
        keywords: [],
        blanks: []
      })

      expect(hints.length).toBeGreaterThan(0)
      expect(hints[0].content).toContain('8 characters')
      expect(hints[0].description).toBe('Character count')
    })

    it('should show starting and ending letters hint second', () => {
      const hints = generateHints('indexing', 'The process is called _______', {
        tags: [],
        keywords: [],
        blanks: []
      })

      expect(hints.length).toBeGreaterThan(1)
      expect(hints[1].content).toContain("Starts with **'I'**")
      expect(hints[1].content).toContain("ends with **'g'**")
      expect(hints[1].description).toBe('Letter boundaries')
    })

    it('should include instructor hints after enhanced hints', () => {
      const instructorHints = ['Improves query performance', 'Database structure rearrangement']
      const hints = generateHints('indexing', 'The process is called _______', {
        tags: [],
        keywords: [],
        blanks: [],
        hints: instructorHints
      })

      expect(hints.length).toBeGreaterThanOrEqual(4) // 2 enhanced + 2 instructor
      expect(hints[2].content).toBe('Improves query performance')
      expect(hints[3].content).toBe('Database structure rearrangement')
      expect(hints[2].description).toContain('Instructor hint')
    })

    it('should handle multi-word answers correctly', () => {
      const hints = generateHints(
        'foreign key',
        'A _______ is used to link tables',
        {
          tags: [],
          keywords: [],
          blanks: []
        }
      )

      expect(hints[0].content).toContain('2 words')
      expect(hints[0].content).toContain('11 characters')
      expect(hints[1].content).toContain('First word starts with')
      expect(hints[1].content).toContain('last word ends with')
    })

    it('should add context hint based on question and tags', () => {
      const hints = generateHints(
        'indexing',
        'The process of rearranging the structure of a database in order to improve query performance is called _______',
        {
          tags: ['SQL', 'Database', 'Performance'],
          keywords: [],
          blanks: []
        },
        undefined,
        { maxHints: 5 }
      )

      // Should have enhanced context hint
      const contextHint = hints.find(h => h.description === 'Question context')
      expect(contextHint).toBeDefined()
      expect(contextHint?.content).toContain('database')
    })

    it('should add keyword hints when keywords are provided', () => {
      const hints = generateHints(
        'indexing',
        'The process is called _______',
        {
          tags: [],
          keywords: ['rearranging', 'structure', 'query'],
          blanks: []
        }
      )

      // Should have keyword hint
      const keywordHint = hints.find(h => h.description === 'Keyword clue')
      expect(keywordHint).toBeDefined()
      expect(keywordHint?.content).toContain('rearranging')
    })

    it('should sanitize instructor hints to prevent spoilers', () => {
      const leakyHints = ['The answer is indexing', 'It involves indexing data']
      const hints = generateHints('indexing', 'Question', {
        tags: [],
        keywords: [],
        blanks: [],
        hints: leakyHints
      })

      // Find instructor hints by description
      const instructorHints = hints.filter(h => h.description.startsWith('Instructor hint'))
      expect(instructorHints).toHaveLength(2)
      expect(instructorHints[0].content).toContain('___') // "The answer is ___"
      expect(instructorHints[1].content).toContain('___') // "It involves ___ data"
      instructorHints.forEach(hint => {
        expect(hint.content).not.toContain('indexing')
      })
    })

    it('should limit hints to maxHints', () => {
      const hints = generateHints('indexing', 'Question', {
        tags: ['SQL', 'Database'],
        keywords: ['rearranging', 'structure'],
        blanks: ['___'],
        hints: ['Hint 1', 'Hint 2', 'Hint 3']
      }, undefined, { maxHints: 3 })

      expect(hints.length).toBe(3)
    })
  })

  describe('selectAdaptiveHint', () => {
    const mockHints = [
      { level: 'low', type: 'contextual', content: 'Concept hint', spoilerLevel: 'low', penalty: 0, description: 'Concept' },
      { level: 'low', type: 'semantic', content: 'Keyword hint', spoilerLevel: 'low', penalty: 0, description: 'Keyword' },
      { level: 'medium', type: 'structural', content: 'Structure hint', spoilerLevel: 'medium', penalty: 0, description: 'Structure' }
    ] as any[]

    it('should return first hint when no user answer', () => {
      const result = selectAdaptiveHint('', 'correct answer', mockHints, 0)

      expect(result?.hint).toBe(mockHints[0])
      expect(result?.reason).toContain('Start with')
    })

    it('should select concept hint for very different answers', () => {
      const result = selectAdaptiveHint('xyz', 'correct answer', mockHints, 0)

      expect(result?.hint).toBe(mockHints[0])
      expect(result?.reason).toContain('far from correct')
    })

    it('should select keyword hint for closer answers', () => {
      const result = selectAdaptiveHint('somewhat correct', 'correct answer', mockHints, 0)

      expect(result?.hint).toBe(mockHints[1])
      expect(result?.reason).toContain('getting closer')
    })

    it('should select structure hint for very close answers', () => {
      const result = selectAdaptiveHint('almost correct answer', 'correct answer', mockHints, 0)

      expect(result?.hint).toBe(mockHints[2])
      expect(result?.reason).toContain('very close')
    })

    it('should return null when answer is very close to correct', () => {
      const result = selectAdaptiveHint('correct answer', 'correct answer', mockHints, 0)

      expect(result).toBeNull()
    })

    it('should respect revealed count and not go backwards', () => {
      const result = selectAdaptiveHint('wrong', 'correct answer', mockHints, 1)

      expect(result?.hint).toBe(mockHints[1]) // Should not go back to index 0
    })
  })
})
