/**
 * Open-Ended Quiz Prompt Templates
 * 
 * Templates for generating open-ended questions
 */

import type { AIMessage } from '@/lib/ai/interfaces'

export interface OpenEndedPromptOptions {
  topic: string
  numberOfQuestions: number
  difficulty: 'easy' | 'medium' | 'hard'
}

/**
 * Build open-ended quiz generation prompt
 */
export function buildOpenEndedPrompt(options: OpenEndedPromptOptions): AIMessage[] {
  const { topic, numberOfQuestions, difficulty } = options
  
  return [
    {
      role: 'system',
      content: 'You are an expert educator that generates thought-provoking open-ended questions that require detailed, analytical responses. Focus on critical thinking and deep understanding.',
    },
    {
      role: 'user',
      content: `Generate ${numberOfQuestions} open-ended questions about "${topic}" at ${difficulty} difficulty.

**Requirements:**
- Questions should require comprehensive answers demonstrating deep understanding
- Encourage critical thinking and analysis
- No simple yes/no or one-word answers
- Questions should explore different aspects: concepts, applications, comparisons, evaluations
- Provide sample answer guidelines or key points to cover`,
    },
  ]
}

/**
 * Open-ended quiz function schema for structured output
 */
export function getOpenEndedFunctionSchema() {
  return {
    name: 'generate_openended_quiz',
    description: 'Generates open-ended questions requiring detailed responses',
    parameters: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string', description: 'The open-ended question' },
              sampleAnswer: { 
                type: 'string',
                description: 'Sample answer or key points to cover'
              },
              rubric: {
                type: 'string',
                description: 'Evaluation criteria for the answer'
              },
            },
            required: ['question', 'sampleAnswer'],
          },
        },
      },
      required: ['questions'],
    },
  }
}

/**
 * Build open-ended prompt with function schema included
 */
export function buildOpenEndedPromptWithSchema(options: OpenEndedPromptOptions) {
  return {
    messages: buildOpenEndedPrompt(options),
    functions: [getOpenEndedFunctionSchema()],
    functionCall: { name: 'generate_openended_quiz' },
  }
}

export default {
  buildOpenEndedPrompt,
  getOpenEndedFunctionSchema,
  buildOpenEndedPromptWithSchema,
}
