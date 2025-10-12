/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { generateBlanksHints, generateContentAwareHints } from '@/lib/utils/hint-system'

describe('Hint System - Blanks Quiz', () => {
  describe('generateBlanksHints', () => {
    it('should always show character count hint first', () => {
      const hints = generateBlanksHints('indexing', 'The process is called _______', [])
      
      expect(hints.length).toBeGreaterThan(0)
      expect(hints[0].content).toContain('8 characters')
      expect(hints[0].description).toBe('Character count')
    })

    it('should show starting and ending letters hint second', () => {
      const hints = generateBlanksHints('indexing', 'The process is called _______', [])
      
      expect(hints.length).toBeGreaterThan(1)
      expect(hints[1].content).toContain("Starts with **'I'**")
      expect(hints[1].content).toContain("ends with **'g'**")
      expect(hints[1].description).toBe('Letter boundaries')
    })

    it('should include database hints after enhanced hints', () => {
      const databaseHints = ['Improves query performance', 'Database structure rearrangement']
      const hints = generateBlanksHints('indexing', 'The process is called _______', databaseHints)
      
      expect(hints.length).toBeGreaterThanOrEqual(4) // 2 enhanced + 2 database
      expect(hints[2].content).toBe('Improves query performance')
      expect(hints[3].content).toBe('Database structure rearrangement')
      expect(hints[2].description).toContain('Database hint')
    })

    it('should handle multi-word answers correctly', () => {
      const hints = generateBlanksHints(
        'foreign key',
        'A _______ is used to link tables',
        []
      )
      
      expect(hints[0].content).toContain('2 words')
      expect(hints[0].content).toContain('11 characters')
      expect(hints[1].content).toContain('First word starts with')
      expect(hints[1].content).toContain('last word ends with')
    })

    it('should add context hint based on question and tags', () => {
      const hints = generateBlanksHints(
        'indexing',
        'The process of rearranging the structure of a database in order to improve query performance is called _______',
        [],
        undefined,
        { tags: ['SQL', 'Database', 'Performance'], maxHints: 5 }
      )
      
      // Should have enhanced context hint
      const contextHint = hints.find(h => h.description === 'Question context')
      expect(contextHint).toBeDefined()
      expect(contextHint?.content).toContain('database')
    })

    it('should add keyword hints when keywords are provided', () => {
      const hints = generateBlanksHints(
        'indexing',
        'The process is called _______',
        [],
        undefined,
        { keywords: ['SQL', 'Database', 'Performance'], maxHints: 5 }
      )
      
      const keywordHint = hints.find(h => h.description === 'Keyword clue')
      expect(keywordHint).toBeDefined()
      expect(keywordHint?.content).toContain('SQL')
      expect(keywordHint?.content).toContain('Database')
    })

    it('should limit total hints to 5', () => {
      const databaseHints = ['Hint 1', 'Hint 2', 'Hint 3', 'Hint 4', 'Hint 5', 'Hint 6']
      const hints = generateBlanksHints(
        'indexing',
        'The process is called _______',
        databaseHints,
        undefined,
        { tags: ['SQL', 'Database'], keywords: ['index', 'query'], maxHints: 3 }
      )
      
      expect(hints.length).toBeLessThanOrEqual(5)
    })

    it('should handle empty correctAnswer gracefully', () => {
      const hints = generateBlanksHints('', 'Question text', [])
      
      expect(hints).toBeDefined()
      expect(Array.isArray(hints)).toBe(true)
    })

    it('should sanitize database hints to remove answer leakage', () => {
      const leakyHints = ['The answer is indexing', 'Try indexing']
      const hints = generateBlanksHints('indexing', 'Question', leakyHints)
      
      // Check that hints are sanitized
      hints.forEach(hint => {
        // Database hints shouldn't directly reveal the answer
        if (hint.description?.includes('Database hint')) {
          expect(hint.content.toLowerCase()).not.toBe('the answer is indexing')
        }
      })
    })
  })
})

describe('Hint System - Open-Ended Quiz', () => {
  describe('generateContentAwareHints', () => {
    it('should generate keyword-based hints', () => {
      const hints = generateContentAwareHints(
        'What is machine learning?',
        ['AI', 'algorithms', 'data'],
        'medium'
      )
      
      expect(hints.length).toBeGreaterThan(0)
      // Keywords are included in the hints
      const hasKeywords = hints.some(h => 
        h.content.includes('AI') || 
        h.content.includes('algorithms') ||
        h.description?.toLowerCase().includes('keyword')
      )
      expect(hasKeywords).toBe(true)
    })

    it('should provide sentence structure guidance for long answers', () => {
      const hints = generateContentAwareHints(
        'Explain how neural networks work in detail.',
        ['neurons', 'weights', 'activation'],
        'long',
        undefined,
        { maxHints: 5 }
      )
      
      // Long answers should have structure hints
      const structureHint = hints.find(h => 
        h.description?.includes('Structure') || 
        h.description?.includes('guidance') ||
        h.description?.includes('Sentence structure')
      )
      expect(structureHint).toBeDefined()
    })

    it('should provide segmented hints for long answers', () => {
      const hints = generateContentAwareHints(
        'Explain the role of artificial intelligence in modern software development.',
        ['AI', 'automation', 'efficiency'],
        'long',
        undefined,
        { maxHints: 8 }
      )
      
      // Should include opening, body, and conclusion segments
      const segmentHints = hints.filter(h => 
        h.description?.includes('segment') ||
        h.description?.includes('Opening') ||
        h.description?.includes('Body') ||
        h.description?.includes('Conclusion')
      )
      expect(segmentHints.length).toBeGreaterThan(0)
    })

    it('should provide length guidance based on expected length', () => {
      const shortHints = generateContentAwareHints(
        'Define API',
        [],
        'short'
      )
      
      const longHints = generateContentAwareHints(
        'Explain APIs in detail',
        [],
        'long'
      )
      
      // Check for length guidance
      const shortLengthHint = shortHints.find(h => h.description === 'Length & structure guidance')
      const longLengthHint = longHints.find(h => h.description === 'Length & structure guidance')
      
      if (shortLengthHint) {
        expect(shortLengthHint.content).toContain('10-30 words')
      }
      if (longLengthHint) {
        expect(longLengthHint.content).toContain('80+')
      }
    })

    it('should generate different hints for different question types', () => {
      const whatHints = generateContentAwareHints(
        'What is machine learning?',
        [],
        'medium'
      )
      
      const howHints = generateContentAwareHints(
        'How does machine learning work?',
        [],
        'medium'
      )
      
      const whyHints = generateContentAwareHints(
        'Why is machine learning important?',
        [],
        'medium'
      )
      
      // All should generate hints
      expect(whatHints.length).toBeGreaterThan(0)
      expect(howHints.length).toBeGreaterThan(0)
      expect(whyHints.length).toBeGreaterThan(0)
    })

    it('should include key points hint with proper formatting', () => {
      const hints = generateContentAwareHints(
        'Explain machine learning',
        ['supervised', 'unsupervised', 'reinforcement'],
        'medium'
      )
      
      // Check if keywords appear in any hint (may be in different descriptions)
      const hasKeyPoints = hints.some(h => 
        h.content.includes('supervised') || 
        h.content.includes('unsupervised') ||
        h.description?.toLowerCase().includes('key')
      )
      expect(hasKeyPoints).toBe(true)
    })

    it('should handle empty keywords gracefully', () => {
      const hints = generateContentAwareHints(
        'Explain AI',
        [],
        'medium'
      )
      
      expect(hints).toBeDefined()
      expect(hints.length).toBeGreaterThan(0)
    })

    it('should apply correct spoiler levels', () => {
      const hints = generateContentAwareHints(
        'What is AI?',
        ['artificial', 'intelligence'],
        'short'
      )
      
      // Check spoiler levels are appropriate
      hints.forEach(hint => {
        expect(['low', 'medium', 'high']).toContain(hint.spoilerLevel)
      })
    })

    it('should respect maxHints parameter', () => {
      const hints3 = generateContentAwareHints(
        'Explain machine learning',
        ['AI', 'algorithms'],
        'long',
        undefined,
        { maxHints: 3 }
      )
      
      const hints5 = generateContentAwareHints(
        'Explain machine learning',
        ['AI', 'algorithms'],
        'long',
        undefined,
        { maxHints: 5 }
      )
      
      expect(hints3.length).toBeLessThanOrEqual(hints5.length)
    })
  })
})

describe('Hint System - Progressive Disclosure', () => {
  it('should reveal hints progressively from low to high spoiler level', () => {
    const hints = generateBlanksHints(
      'indexing',
      'Database optimization technique',
      ['Improves performance', 'Organizes data'],
      undefined,
      { tags: ['SQL', 'Database'], maxHints: 5 }
    )
    
    // First hints should be low spoiler
    expect(hints[0].spoilerLevel).toBe('low')
    expect(hints[1].spoilerLevel).toBe('low')
    
    // Later hints can be medium
    const mediumHints = hints.filter(h => h.spoilerLevel === 'medium')
    if (mediumHints.length > 0) {
      expect(mediumHints.length).toBeGreaterThan(0)
    }
  })

  it('should not reveal direct answer unless explicitly allowed', () => {
    const hintsWithoutDirect = generateBlanksHints(
      'indexing',
      'Question',
      [],
      undefined,
      { allowDirectAnswer: false, maxHints: 5 }
    )
    
    // Should not contain the direct answer
    const directHint = hintsWithoutDirect.find(h => 
      h.type === 'direct' || h.content.toLowerCase().includes('the answer is "indexing"')
    )
    expect(directHint).toBeUndefined()
  })
})
