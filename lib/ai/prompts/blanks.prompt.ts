/**
 * Fill-in-the-Blanks Quiz Prompt Templates
 * 
 * Templates for generating fill-in-the-blanks questions
 */

import type { AIMessage } from '@/lib/ai/interfaces'

interface BlanksPromptOptions {
  topic: string
  numberOfQuestions: number
  difficulty?: 'easy' | 'medium' | 'hard'
}

/**
 * Build fill-in-the-blanks quiz generation prompt
 */
export function buildBlanksPrompt(options: BlanksPromptOptions): AIMessage[] {
  const { topic, numberOfQuestions, difficulty = 'medium' } = options
  
  return [
    {
      role: 'system',
      content: 'You are an AI that generates fill-in-the-blanks quizzes. Create sentences with key terms removed that students must fill in.',
    },
    {
      role: 'user',
      content: `Generate ${numberOfQuestions} fill-in-the-blanks questions about "${topic}" at ${difficulty} difficulty.

**Requirements:**
- Each question should be a sentence with one or more key terms removed (marked with _____)
- Provide the correct answer(s) for each blank
- Questions should test understanding of key concepts
- Use technical terms appropriate for ${difficulty} difficulty level`,
    },
  ]
}

/**
 * Fill-in-the-blanks function schema for structured output
 */
export function getBlanksFunctionSchema() {
  return {
    name: 'generate_blanks_quiz',
    description: 'Generates fill-in-the-blanks questions with answers',
    parameters: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { 
                type: 'string',
                description: 'Question with blanks marked as _____'
              },
              answer: { 
                type: 'string',
                description: 'The correct answer for the blank'
              },
              answers: {
                type: 'array',
                items: { type: 'string' },
                description: 'Multiple answers if multiple blanks'
              },
            },
            required: ['question', 'answer'],
          },
        },
      },
      required: ['questions'],
    },
  }
}

/**
 * Build blanks prompt with function schema included
 */
export function buildBlanksPromptWithSchema(options: BlanksPromptOptions) {
  return {
    messages: buildBlanksPrompt(options),
    functions: [getBlanksFunctionSchema()],
    functionCall: { name: 'generate_blanks_quiz' },
  }
}


