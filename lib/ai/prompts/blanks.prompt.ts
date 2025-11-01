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
  isSubscribed?: boolean
}

/**
 * Build fill-in-the-blanks quiz generation prompt
 */
export function buildBlanksPrompt(options: BlanksPromptOptions): AIMessage[] {
  const { topic, numberOfQuestions, difficulty = 'medium', isSubscribed = false } = options
  
  const systemMessage: AIMessage = isSubscribed
    ? {
        role: 'system',
        content: 'You are an expert AI educator that generates high-quality fill-in-the-blanks quizzes with contextually rich sentences and comprehensive answer explanations. Create sophisticated questions that test deep understanding and critical thinking.',
      }
    : {
        role: 'system',
        content: 'You are an AI that generates fill-in-the-blanks quizzes. Create sentences with key terms removed that students must fill in.',
      }
  
  return [
    systemMessage,
    {
      role: 'user',
      content: `Generate ${numberOfQuestions} fill-in-the-blanks questions about "${topic}" at ${difficulty} difficulty.

**Requirements:**
- Each question should be a sentence with one or more key terms removed (marked with _____)
- Provide the correct answer(s) for each blank
- Questions should test understanding of key concepts
- Use technical terms appropriate for ${difficulty} difficulty level${isSubscribed ? '\n- Include context-rich sentences that demonstrate real-world application\n- Add questions requiring analysis of relationships between concepts\n- Provide detailed explanations for why each answer is correct\n- Include advanced terminology and nuanced understanding' : ''}`,
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


