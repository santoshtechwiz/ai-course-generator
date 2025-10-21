/**
 * Advanced Prompt Validation Tests
 * 
 * Comprehensive testing of all prompt generation functions
 * Validates:
 * - Schema compliance
 * - Question quality  
 * - No duplicate content
 * - Educational value
 * - Bug-free generation
 * - Genuine content (not generic)
 * - Proper structure and formatting
 */

import { describe, it, expect } from 'vitest'
import {
  buildMCQPrompt,
  getMCQFunctionSchema,
  buildMCQPromptWithSchema,
} from '@/lib/ai/prompts/mcq.prompt'
import {
  buildOrderingPrompt,
  getOrderingFunctionSchema,
  buildOrderingPromptWithSchema,
} from '@/lib/ai/prompts/ordering.prompt'
import {
  buildBlanksPrompt,
  getBlanksFunctionSchema,
  buildBlanksPromptWithSchema,
} from '@/lib/ai/prompts/blanks.prompt'
import {
  buildFlashcardPrompt,
  getFlashcardFunctionSchema,
  buildFlashcardPromptWithSchema,
} from '@/lib/ai/prompts/flashcard.prompt'

// ============================================================================
// 1. MCQ PROMPT TESTS
// ============================================================================

describe('MCQ Prompt - Advanced Validation', () => {
  describe('Prompt Message Structure', () => {
    it('should generate system and user messages', () => {
      const messages = buildMCQPrompt({
        topic: 'Python Programming',
        numberOfQuestions: 5,
        difficulty: 'medium',
      })

      expect(messages).toHaveLength(2)
      expect(messages[0].role).toBe('system')
      expect(messages[1].role).toBe('user')
    })

    it('should differentiate premium vs free tier messages', () => {
      const freeMessages = buildMCQPrompt({
        topic: 'React',
        numberOfQuestions: 3,
        difficulty: 'easy',
        isPremium: false,
      })

      const premiumMessages = buildMCQPrompt({
        topic: 'React',
        numberOfQuestions: 3,
        difficulty: 'easy',
        isPremium: true,
      })

      // Premium has "advanced" in user message, not system
      expect(freeMessages[1].content).not.toContain('advanced')
      expect(premiumMessages[1].content).toContain('advanced')
      // Premium includes detailed explanation requirement
      expect(freeMessages[1].content).not.toContain('detailed')
      expect(premiumMessages[1].content).toContain('detailed')
    })

    it('should include topic in user message', () => {
      const topic = 'Machine Learning Algorithms'
      const messages = buildMCQPrompt({
        topic,
        numberOfQuestions: 5,
        difficulty: 'hard',
      })

      expect(messages[1].content).toContain(topic)
    })

    it('should include number of questions in prompt', () => {
      const numberOfQuestions = 10
      const messages = buildMCQPrompt({
        topic: 'JavaScript',
        numberOfQuestions,
        difficulty: 'medium',
      })

      expect(messages[1].content).toContain(String(numberOfQuestions))
    })

    it('should include difficulty level in prompt', () => {
      const difficulties = ['easy', 'medium', 'hard'] as const
      difficulties.forEach((difficulty) => {
        const messages = buildMCQPrompt({
          topic: 'Testing',
          numberOfQuestions: 5,
          difficulty,
        })

        expect(messages[1].content).toContain(difficulty)
      })
    })
  })

  describe('MCQ Function Schema', () => {
    it('should have correct schema structure', () => {
      const schema = getMCQFunctionSchema()

      expect(schema.name).toBe('generate_mcq_quiz')
      expect(schema.parameters.type).toBe('object')
      expect(schema.parameters.properties.questions).toBeDefined()
    })

    it('should enforce 4 options per question', () => {
      const schema = getMCQFunctionSchema()
      const optionsSchema = schema.parameters.properties.questions.items.properties.options

      expect(optionsSchema.minItems).toBe(4)
      expect(optionsSchema.maxItems).toBe(4)
    })

    it('should require correct answer index 0-3', () => {
      const schema = getMCQFunctionSchema()
      const correctAnswerSchema =
        schema.parameters.properties.questions.items.properties.correctAnswer

      expect(correctAnswerSchema.type).toBe('number')
      expect(correctAnswerSchema.description).toContain('0-3')
    })

    it('should have all required fields', () => {
      const schema = getMCQFunctionSchema()
      const itemRequired = schema.parameters.properties.questions.items.required

      expect(itemRequired).toContain('question')
      expect(itemRequired).toContain('options')
      expect(itemRequired).toContain('correctAnswer')
    })
  })

  describe('Complete MCQ Prompt with Schema', () => {
    it('should return messages, functions, and functionCall', () => {
      const result = buildMCQPromptWithSchema({
        topic: 'Database Design',
        numberOfQuestions: 5,
        difficulty: 'medium',
      })

      expect(result.messages).toHaveLength(2)
      expect(result.functions).toHaveLength(1)
      expect(result.functionCall.name).toBe('generate_mcq_quiz')
    })

    it('should be valid for API consumption', () => {
      const result = buildMCQPromptWithSchema({
        topic: 'Cloud Computing',
        numberOfQuestions: 5,
        difficulty: 'hard',
      })

      expect(result.messages).toBeDefined()
      expect(result.functions).toBeDefined()
      expect(result.functionCall).toBeDefined()
      expect(() => JSON.stringify(result)).not.toThrow()
    })
  })
})

// ============================================================================
// 2. ORDERING PROMPT TESTS
// ============================================================================

describe('Ordering Prompt - Advanced Validation', () => {
  describe('Prompt Message Structure', () => {
    it('should generate system and user messages', () => {
      const messages = buildOrderingPrompt({
        topic: 'Docker Deployment',
        numberOfSteps: 7,
        difficulty: 'medium',
      })

      expect(messages).toHaveLength(2)
      expect(messages[0].role).toBe('system')
      expect(messages[1].role).toBe('user')
    })

    it('should include technical context in system message', () => {
      const messages = buildOrderingPrompt({
        topic: 'CI/CD Pipeline',
        numberOfSteps: 5,
        difficulty: 'easy',
      })

      expect(messages[0].content).toContain('ordering')
      expect(messages[0].content).toContain('sequencing')
      expect(messages[0].content).toContain('technical')
    })

    it('should specify exact number of steps', () => {
      const numberOfSteps = 8
      const messages = buildOrderingPrompt({
        topic: 'Database Migration',
        numberOfSteps,
        difficulty: 'hard',
      })

      expect(messages[1].content).toContain(String(numberOfSteps))
    })

    it('should include requirements in user prompt', () => {
      const messages = buildOrderingPrompt({
        topic: 'Git Workflow',
        numberOfSteps: 5,
        difficulty: 'medium',
      })

      expect(messages[1].content).toContain('Requirements')
      expect(messages[1].content).toContain('sequential')
      expect(messages[1].content).toContain('coherent')
    })

    it('should provide helpful examples', () => {
      const messages = buildOrderingPrompt({
        topic: 'API Development',
        numberOfSteps: 6,
        difficulty: 'medium',
      })

      expect(messages[1].content).toContain('Example topics')
      expect(messages[1].content).toContain('Docker')
      expect(messages[1].content).toContain('CI/CD')
    })
  })

  describe('Ordering Function Schema', () => {
    it('should have correct schema structure', () => {
      const schema = getOrderingFunctionSchema()

      expect(schema.name).toBe('generate_ordering_quiz')
      expect(schema.parameters.type).toBe('object')
    })

    it('should require title, description, steps, difficulty', () => {
      const schema = getOrderingFunctionSchema()
      const required = schema.parameters.required

      expect(required).toContain('title')
      expect(required).toContain('description')
      expect(required).toContain('steps')
      expect(required).toContain('difficulty')
    })

    it('should have difficulty enum validation', () => {
      const schema = getOrderingFunctionSchema()
      const difficultyEnum = schema.parameters.properties.difficulty.enum

      expect(difficultyEnum).toContain('easy')
      expect(difficultyEnum).toContain('medium')
      expect(difficultyEnum).toContain('hard')
    })

    it('should define step structure with id, description, explanation', () => {
      const schema = getOrderingFunctionSchema()
      const stepsSchema = schema.parameters.properties.steps

      expect(stepsSchema.type).toBe('array')
      expect(stepsSchema.items.properties.id).toBeDefined()
      expect(stepsSchema.items.properties.description).toBeDefined()
      expect(stepsSchema.items.properties.explanation).toBeDefined()
    })
  })

  describe('Complete Ordering Prompt with Schema', () => {
    it('should return valid prompt structure', () => {
      const result = buildOrderingPromptWithSchema({
        topic: 'Kubernetes Deployment',
        numberOfSteps: 8,
        difficulty: 'hard',
      })

      expect(result.messages).toBeDefined()
      expect(result.functions).toBeDefined()
      expect(result.functionCall).toBeDefined()
    })

    it('should be JSON serializable', () => {
      const result = buildOrderingPromptWithSchema({
        topic: 'Microservices Architecture',
        numberOfSteps: 6,
        difficulty: 'hard',
      })

      expect(() => JSON.stringify(result)).not.toThrow()
    })
  })
})

// ============================================================================
// 3. BLANKS PROMPT TESTS
// ============================================================================

describe('Blanks Prompt - Advanced Validation', () => {
  describe('Prompt Message Structure', () => {
    it('should generate system and user messages', () => {
      const messages = buildBlanksPrompt({
        topic: 'Spanish Vocabulary',
        numberOfQuestions: 5,
      })

      expect(messages).toHaveLength(2)
      expect(messages[0].role).toBe('system')
      expect(messages[1].role).toBe('user')
    })

    it('should mention blanks in system message', () => {
      const messages = buildBlanksPrompt({
        topic: 'Biology',
        numberOfQuestions: 5,
      })

      const content = messages[0].content.toLowerCase()
      expect(content).toContain('blank')
    })

    it('should specify number of questions', () => {
      const numberOfQuestions = 7
      const messages = buildBlanksPrompt({
        topic: 'History',
        numberOfQuestions,
      })

      expect(messages[1].content).toContain(String(numberOfQuestions))
    })

    it('should support difficulty levels with defaults', () => {
      const easyMessages = buildBlanksPrompt({
        topic: 'Chemistry',
        numberOfQuestions: 5,
        difficulty: 'easy',
      })

      const hardMessages = buildBlanksPrompt({
        topic: 'Chemistry',
        numberOfQuestions: 5,
        difficulty: 'hard',
      })

      expect(easyMessages).toBeDefined()
      expect(hardMessages).toBeDefined()
    })
  })

  describe('Blanks Function Schema', () => {
    it('should have correct schema name', () => {
      const schema = getBlanksFunctionSchema()

      expect(schema.name).toBe('generate_blanks_quiz')
    })

    it('should define question structure with answer and answers array', () => {
      const schema = getBlanksFunctionSchema()
      const questionSchema = schema.parameters.properties.questions.items.properties

      expect(questionSchema.question).toBeDefined()
      expect(questionSchema.answer).toBeDefined()
      expect(questionSchema.answers).toBeDefined()
    })

    it('should require question and answer fields', () => {
      const schema = getBlanksFunctionSchema()
      const itemRequired = schema.parameters.properties.questions.items.required

      expect(itemRequired).toContain('question')
      expect(itemRequired).toContain('answer')
    })
  })

  describe('Complete Blanks Prompt with Schema', () => {
    it('should return complete prompt structure', () => {
      const result = buildBlanksPromptWithSchema({
        topic: 'Mathematics',
        numberOfQuestions: 5,
      })

      expect(result.messages).toBeDefined()
      expect(result.functions).toBeDefined()
      expect(result.functionCall?.name).toBe('generate_blanks_quiz')
    })

    it('should be valid JSON', () => {
      const result = buildBlanksPromptWithSchema({
        topic: 'Economics',
        numberOfQuestions: 5,
      })

      expect(() => JSON.stringify(result)).not.toThrow()
    })
  })
})

// ============================================================================
// 4. FLASHCARD PROMPT TESTS
// ============================================================================

describe('Flashcard Prompt - Advanced Validation', () => {
  describe('Prompt Message Structure', () => {
    it('should generate system and user messages', () => {
      const messages = buildFlashcardPrompt({
        topic: 'German Vocabulary',
        count: 10,
      })

      expect(messages).toHaveLength(2)
      expect(messages[0].role).toBe('system')
      expect(messages[1].role).toBe('user')
    })

    it('should mention flashcards in system message', () => {
      const messages = buildFlashcardPrompt({
        topic: 'Physics',
        count: 5,
      })

      const content = messages[0].content.toLowerCase()
      expect(content).toContain('flashcard')
    })

    it('should specify number of cards', () => {
      const count = 15
      const messages = buildFlashcardPrompt({
        topic: 'Art History',
        count,
      })

      expect(messages[1].content).toContain(String(count))
    })

    it('should include learning objectives', () => {
      const messages = buildFlashcardPrompt({
        topic: 'Psychology',
        count: 5,
      })

      const content = messages[1].content.toLowerCase()
      // Flashcard prompts focus on "remember", "focus", "facts", "key concepts"
      expect(content).toMatch(/remember|key|concepts|definitions|facts/)
    })
  })

  describe('Flashcard Function Schema', () => {
    it('should have correct schema name', () => {
      const schema = getFlashcardFunctionSchema()

      expect(schema.name).toBe('generate_flashcards')
    })

    it('should define flashcard structure with question and answer', () => {
      const schema = getFlashcardFunctionSchema()
      const cardSchema = schema.parameters.properties.flashcards.items.properties

      expect(cardSchema.question).toBeDefined()
      expect(cardSchema.answer).toBeDefined()
    })

    it('should require question and answer fields', () => {
      const schema = getFlashcardFunctionSchema()
      const itemRequired = schema.parameters.properties.flashcards.items.required

      expect(itemRequired).toContain('question')
      expect(itemRequired).toContain('answer')
    })
  })

  describe('Complete Flashcard Prompt with Schema', () => {
    it('should return complete prompt structure', () => {
      const result = buildFlashcardPromptWithSchema({
        topic: 'Anatomy',
        count: 20,
      })

      expect(result.messages).toBeDefined()
      expect(result.functions).toBeDefined()
      expect(result.functionCall?.name).toBe('generate_flashcards')
    })

    it('should be valid JSON', () => {
      const result = buildFlashcardPromptWithSchema({
        topic: 'Geography',
        count: 10,
      })

      expect(() => JSON.stringify(result)).not.toThrow()
    })
  })
})

// ============================================================================
// 5. CROSS-PROMPT VALIDATION TESTS
// ============================================================================

describe('All Prompts - Quality Assurance', () => {
  describe('Bug-Free Generation', () => {
    it('MCQ prompt should handle special characters in topic', () => {
      expect(() => {
        buildMCQPrompt({
          topic: 'React & TypeScript (Advanced)',
          numberOfQuestions: 5,
          difficulty: 'hard',
        })
      }).not.toThrow()
    })

    it('Ordering prompt should handle long topic names', () => {
      expect(() => {
        buildOrderingPrompt({
          topic: 'Complex microservices architecture with distributed systems',
          numberOfSteps: 10,
          difficulty: 'hard',
        })
      }).not.toThrow()
    })

    it('Blanks prompt should handle numeric topics', () => {
      expect(() => {
        buildBlanksPrompt({
          topic: 'Calculus II: Advanced Integration Techniques',
          numberOfQuestions: 5,
        })
      }).not.toThrow()
    })

    it('Flashcard prompt should handle unicode characters', () => {
      expect(() => {
        buildFlashcardPrompt({
          topic: '中文 (Chinese) Grammar',
          count: 10,
        })
      }).not.toThrow()
    })
  })

  describe('Schema Validation Compliance', () => {
    it('all schemas should be JSON serializable', () => {
      const schemas = [
        getMCQFunctionSchema(),
        getOrderingFunctionSchema(),
        getBlanksFunctionSchema(),
        getFlashcardFunctionSchema(),
      ]

      schemas.forEach((schema) => {
        expect(() => JSON.stringify(schema)).not.toThrow()
      })
    })

    it('all schemas should have descriptions', () => {
      const schemas = [
        getMCQFunctionSchema(),
        getOrderingFunctionSchema(),
        getBlanksFunctionSchema(),
        getFlashcardFunctionSchema(),
      ]

      schemas.forEach((schema) => {
        expect(schema.description).toBeTruthy()
        expect(schema.description.length).toBeGreaterThan(10)
      })
    })

    it('all schemas should have parameters defined', () => {
      const schemas = [
        getMCQFunctionSchema(),
        getOrderingFunctionSchema(),
        getBlanksFunctionSchema(),
        getFlashcardFunctionSchema(),
      ]

      schemas.forEach((schema) => {
        expect(schema.parameters).toBeDefined()
        expect(schema.parameters.type).toBe('object')
      })
    })
  })

  describe('Genuine Content Generation', () => {
    it('MCQ prompt should request varied, topic-specific questions', () => {
      const messages = buildMCQPrompt({
        topic: 'Advanced Algorithms',
        numberOfQuestions: 5,
        difficulty: 'hard',
      })

      expect(messages[1].content).toContain('Advanced Algorithms')
    })

    it('Ordering prompt should emphasize logical workflow', () => {
      const messages = buildOrderingPrompt({
        topic: 'DevOps Pipeline',
        numberOfSteps: 7,
        difficulty: 'medium',
      })

      const content = messages[1].content
      expect(content).toContain('sequential')
      expect(content).toContain('workflow')
    })

    it('Blanks prompt should generate contextual fill-in-blanks', () => {
      const messages = buildBlanksPrompt({
        topic: 'Molecular Biology',
        numberOfQuestions: 5,
      })

      expect(messages[1].content).toContain('Molecular Biology')
    })

    it('Flashcard prompt should encourage memory and learning', () => {
      const messages = buildFlashcardPrompt({
        topic: 'Foreign Language Vocabulary',
        count: 20,
      })

      const content = messages[0].content.toLowerCase()
      expect(content).toMatch(/memory|learn|study|recall/)
    })
  })

  describe('No Duplicate Content Detection', () => {
    it('MCQ prompt should not have excessive duplication', () => {
      const schema = getMCQFunctionSchema()
      const description = JSON.stringify(schema)
      const optionMatches = (description.match(/option/gi) || []).length

      expect(optionMatches).toBeLessThanOrEqual(5)
    })

    it('Ordering prompt should not repeat requirements excessively', () => {
      const messages = buildOrderingPrompt({
        topic: 'Test',
        numberOfSteps: 5,
        difficulty: 'easy',
      })

      const content = messages[1].content
      const sequentialCount = (content.match(/sequential/gi) || []).length

      expect(sequentialCount).toBeLessThanOrEqual(3)
    })
  })

  describe('Educational Value', () => {
    it('MCQ prompt should include explanation requirement for premium', () => {
      const premiumMessages = buildMCQPrompt({
        topic: 'Test',
        numberOfQuestions: 5,
        difficulty: 'medium',
        isPremium: true,
      })

      expect(premiumMessages[1].content).toContain('explanation')
    })

    it('Ordering prompt should emphasize coherent workflow', () => {
      const messages = buildOrderingPrompt({
        topic: 'Test',
        numberOfSteps: 5,
        difficulty: 'medium',
      })

      expect(messages[1].content).toContain('coherent')
    })

    it('Blanks prompt should be substantial', () => {
      const messages = buildBlanksPrompt({
        topic: 'Test',
        numberOfQuestions: 5,
      })

      expect(messages).toBeDefined()
      expect(messages[1].content.length).toBeGreaterThan(50)
    })

    it('Flashcard prompt should support effective learning', () => {
      const messages = buildFlashcardPrompt({
        topic: 'Test',
        count: 10,
      })

      expect(messages[0].content.toLowerCase()).toMatch(/learn|study|memory/)
    })
  })

  describe('Prompt Consistency', () => {
    it('all prompts should return array of messages', () => {
      const prompts = [
        buildMCQPrompt({
          topic: 'Test',
          numberOfQuestions: 5,
          difficulty: 'medium',
        }),
        buildOrderingPrompt({
          topic: 'Test',
          numberOfSteps: 5,
          difficulty: 'medium',
        }),
        buildBlanksPrompt({
          topic: 'Test',
          numberOfQuestions: 5,
        }),
        buildFlashcardPrompt({
          topic: 'Test',
          count: 5,
        }),
      ]

      prompts.forEach((prompt) => {
        expect(Array.isArray(prompt)).toBe(true)
        expect(prompt.length).toBeGreaterThan(0)
        prompt.forEach((msg: any) => {
          expect(msg.role).toMatch(/system|user/)
          expect(msg.content).toBeTruthy()
          expect(msg.content.length).toBeGreaterThan(0)
        })
      })
    })

    it('all complete prompts should have messages, functions, and functionCall', () => {
      const completePrompts = [
        buildMCQPromptWithSchema({
          topic: 'Test',
          numberOfQuestions: 5,
          difficulty: 'medium',
        }),
        buildOrderingPromptWithSchema({
          topic: 'Test',
          numberOfSteps: 5,
          difficulty: 'medium',
        }),
        buildBlanksPromptWithSchema({
          topic: 'Test',
          numberOfQuestions: 5,
        }),
        buildFlashcardPromptWithSchema({
          topic: 'Test',
          count: 5,
        }),
      ]

      completePrompts.forEach((prompt: any) => {
        expect(prompt.messages).toBeDefined()
        expect(prompt.functions).toBeDefined()
        expect(prompt.functionCall).toBeDefined()
        expect(Array.isArray(prompt.functions)).toBe(true)
        expect(prompt.functions.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Question Generation Quality', () => {
    it('MCQ prompt should be suitable for genuine question generation', () => {
      const messages = buildMCQPrompt({
        topic: 'Web Development',
        numberOfQuestions: 5,
        difficulty: 'hard',
        isPremium: true,
      })

      const userContent = messages[1].content
      expect(userContent).toContain('difficulty')
      expect(userContent).toContain('options')
      expect(userContent).toContain('explanation')
    })

    it('Ordering prompt should generate logical sequences', () => {
      const messages = buildOrderingPrompt({
        topic: 'Software Testing',
        numberOfSteps: 7,
        difficulty: 'medium',
      })

      expect(messages[1].content).toContain('coherent')
      expect(messages[1].content).toContain('complete workflow')
    })

    it('Blanks prompt should support varied answer formats', () => {
      const messages = buildBlanksPrompt({
        topic: 'Grammar',
        numberOfQuestions: 10,
      })

      expect(messages[1].content.length).toBeGreaterThan(100)
    })

    it('Flashcard prompt should enable effective memorization', () => {
      const messages = buildFlashcardPrompt({
        topic: 'Medical Terminology',
        count: 50,
      })

      expect(messages[0].content.length).toBeGreaterThan(50)
      expect(messages[1].content.length).toBeGreaterThan(50)
    })
  })
})
