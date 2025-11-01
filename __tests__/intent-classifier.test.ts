/**
 * Intent Classifier Tests
 * Ensures proper intent detection and topic extraction
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IntentClassifier } from '@/app/aimodel/chat/IntentClassifier'
import { ChatIntent } from '@/types/chat.types'

// Mock OpenAI to avoid requiring API key in tests
vi.mock('openai', () => ({
  default: class OpenAI {
    constructor() {}
    chat = {
      completions: {
        create: vi.fn()
      }
    }
  }
}))

// Mock NlpIntentClassifier to avoid file system operations
vi.mock('@/app/services/chat/NlpIntentClassifier', () => ({
  NlpIntentClassifier: class NlpIntentClassifier {
    addIntent() {}
    train() {}
    predict() {
      return { intent: null, score: 0 }
    }
  }
}))

describe('IntentClassifier', () => {
  let classifier: IntentClassifier

  beforeEach(() => {
    // Set a dummy API key for tests
    process.env.OPENAI_API_KEY = 'test-key'
    classifier = new IntentClassifier()
  })

  describe('Course Navigation Intent', () => {
    it('should detect navigate_course for "Help me find JavaScript tutorials"', async () => {
      const result = await classifier.classify('Help me find JavaScript tutorials')
      
      expect(result.intent).toBe(ChatIntent.NAVIGATE_COURSE)
      expect(result.confidence).toBeGreaterThanOrEqual(0.85)
      expect(result.entities.topics).toContain('javascript')
    })

    it('should detect navigate_course for "Looking for Python courses"', async () => {
      const result = await classifier.classify('Looking for Python courses')
      
      expect(result.intent).toBe(ChatIntent.NAVIGATE_COURSE)
      expect(result.confidence).toBeGreaterThanOrEqual(0.85)
      expect(result.entities.topics).toContain('python')
    })

    it('should detect navigate_course for "Show me React tutorials"', async () => {
      const result = await classifier.classify('Show me React tutorials')
      
      expect(result.intent).toBe(ChatIntent.NAVIGATE_COURSE)
      expect(result.confidence).toBeGreaterThanOrEqual(0.85)
      expect(result.entities.topics).toContain('react')
    })

    it('should detect navigate_course for "Need to learn Node.js"', async () => {
      const result = await classifier.classify('Need to learn Node.js')
      
      expect(result.intent).toBe(ChatIntent.NAVIGATE_COURSE)
      expect(result.confidence).toBeGreaterThanOrEqual(0.85)
      // Node.js is detected as 'node', not 'nodejs'
      expect(result.entities.topics).toContain('node')
    })

    it('should detect navigate_course for "Find courses on TypeScript"', async () => {
      const result = await classifier.classify('Find courses on TypeScript')
      
      expect(result.intent).toBe(ChatIntent.NAVIGATE_COURSE)
      expect(result.confidence).toBeGreaterThanOrEqual(0.90)
      expect(result.entities.topics).toContain('typescript')
    })
  })

  describe('Topic Extraction', () => {
    it('should extract multiple tech topics', async () => {
      const result = await classifier.classify('Help me find JavaScript and React courses')
      
      expect(result.entities.topics).toContain('javascript')
      expect(result.entities.topics).toContain('react')
    })

    it('should extract programming languages', async () => {
      const languages = ['python', 'java', 'typescript', 'rust', 'go']
      
      for (const lang of languages) {
        const result = await classifier.classify(`Show me ${lang} tutorials`)
        expect(result.entities.topics).toContain(lang)
      }
    })

    it('should extract frameworks and technologies', async () => {
      const techs = ['react', 'angular', 'vue', 'docker', 'kubernetes']
      
      for (const tech of techs) {
        const result = await classifier.classify(`Looking for ${tech} courses`)
        expect(result.entities.topics).toContain(tech)
      }
    })
  })

  describe('Off-Topic Detection', () => {
    it('should detect off-topic for greetings only', async () => {
      const greetings = ['Hi', 'Hello', 'Hey there', 'Good morning']
      
      for (const greeting of greetings) {
        const result = await classifier.classify(greeting)
        expect(result.intent).toBe(ChatIntent.OFF_TOPIC)
      }
    })

    it.skip('should detect off-topic for unrelated queries', async () => {
      const offTopicQueries = [
        'What is the weather today?',
        'Tell me a joke',
        'What movies are playing?'
      ]
      
      for (const query of offTopicQueries) {
        const result = await classifier.classify(query)
        expect(result.intent).toBe(ChatIntent.OFF_TOPIC)
      }
    })
  })

  describe('General Help vs Course Navigation', () => {
    it('should NOT confuse "help find" with general_help', async () => {
      const result = await classifier.classify('Help me find JavaScript tutorials')
      
      // Should be navigate_course, NOT general_help
      expect(result.intent).toBe(ChatIntent.NAVIGATE_COURSE)
      expect(result.intent).not.toBe(ChatIntent.GENERAL_HELP)
    })

    it('should detect general_help for platform help', async () => {
      const result = await classifier.classify('How do I use the platform?')
      
      expect(result.intent).toBe(ChatIntent.GENERAL_HELP)
    })

    it('should prioritize topics over generic help pattern', async () => {
      const result = await classifier.classify('I need help learning React')
      
      // Even though "help" is mentioned, React topic should override
      expect(result.intent).toBe(ChatIntent.NAVIGATE_COURSE)
      expect(result.entities.topics).toContain('react')
    })
  })

  describe('Quiz Navigation Intent', () => {
    it('should detect navigate_quiz for quiz queries with quiz pattern', async () => {
      const result = await classifier.classify('Show me quizzes on JavaScript')
      
      expect(result.intent).toBe(ChatIntent.NAVIGATE_QUIZ)
      expect(result.entities.topics).toContain('javascript')
    })
  })

  describe('Performance - No AI Calls', () => {
    it('should resolve without AI for common queries (fast)', async () => {
      const startTime = Date.now()
      
      await classifier.classify('Help me find JavaScript tutorials')
      
      const duration = Date.now() - startTime
      
      // Should be instant (< 100ms) because no AI call
      expect(duration).toBeLessThan(100)
    })

    it('should use pattern matching for tech topics (no tokens)', async () => {
      // These should all resolve via patterns, not AI
      const queries = [
        'Find Python courses',
        'Show me React tutorials',
        'Looking for JavaScript learning',
        'Need Node.js courses'
      ]
      
      for (const query of queries) {
        const startTime = Date.now()
        const result = await classifier.classify(query)
        const duration = Date.now() - startTime
        
        expect(result.intent).toBe(ChatIntent.NAVIGATE_COURSE)
        expect(duration).toBeLessThan(100) // No AI call = fast
      }
    })
  })
})
