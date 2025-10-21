/**
 * Flashcard Prompt Templates
 * 
 * Templates for generating flashcards for studying
 */

import type { AIMessage } from '@/lib/ai/interfaces'

interface FlashcardPromptOptions {
  topic: string
  count: number
}

/**
 * Build flashcard generation prompt
 */
export function buildFlashcardPrompt(options: FlashcardPromptOptions): AIMessage[] {
  const { topic, count } = options
  
  return [
    {
      role: 'system',
      content: 'You are an AI that generates flashcards for studying. Create concise, memorable flashcards with clear questions and comprehensive answers.',
    },
    {
      role: 'user',
      content: `Generate ${count} flashcards about "${topic}". Each should have a question and answer. Focus on key concepts, definitions, and important facts that students need to remember.`,
    },
  ]
}

/**
 * Flashcard function schema for structured output
 */
export function getFlashcardFunctionSchema() {
  return {
    name: 'generate_flashcards',
    description: 'Generates flashcards with questions and answers',
    parameters: {
      type: 'object',
      properties: {
        flashcards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string', description: 'The flashcard question' },
              answer: { type: 'string', description: 'The flashcard answer' },
            },
            required: ['question', 'answer'],
          },
        },
      },
      required: ['flashcards'],
    },
  }
}

/**
 * Build flashcard prompt with function schema included
 */
export function buildFlashcardPromptWithSchema(options: FlashcardPromptOptions) {
  return {
    messages: buildFlashcardPrompt(options),
    functions: [getFlashcardFunctionSchema()],
    functionCall: { name: 'generate_flashcards' },
  }
}


