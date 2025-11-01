/**
 * Open-Ended Quiz Prompt Templates
 * 
 * Templates for generating open-ended questions
 */

import type { AIMessage } from '@/lib/ai/interfaces'

interface OpenEndedPromptOptions {
  topic: string
  numberOfQuestions: number
  difficulty: 'easy' | 'medium' | 'hard'
  isSubscribed?: boolean
}

/**
 * Build open-ended quiz generation prompt
 */
export function buildOpenEndedPrompt(options: OpenEndedPromptOptions): AIMessage[] {
  const { topic, numberOfQuestions, difficulty, isSubscribed = false } = options
  
  const systemMessage: AIMessage = isSubscribed
    ? {
        role: 'system',
        content: 'You are an expert AI educator that generates high-quality, thought-provoking open-ended questions that require detailed, analytical responses. Focus on critical thinking, deep understanding, and comprehensive analysis.',
      }
    : {
        role: 'system',
        content: 'You are an expert educator that generates thought-provoking open-ended questions that require detailed, analytical responses. Focus on critical thinking and deep understanding.',
      }
  
  return [
    systemMessage,
    {
      role: 'user',
      content: `Generate ${numberOfQuestions} open-ended questions about "${topic}" at ${difficulty} difficulty.

**Requirements:**
- Questions should require comprehensive answers demonstrating deep understanding
- Encourage critical thinking and analysis
- No simple yes/no or one-word answers
- Questions should explore different aspects: concepts, applications, comparisons, evaluations
- Provide sample answer guidelines or key points to cover${isSubscribed ? '\n- Include advanced analysis questions that connect multiple concepts\n- Add questions requiring evaluation of real-world applications\n- Ensure questions promote higher-order thinking skills' : ''}`,
    },
  ]
}

/**
 * Open-ended quiz function schema for structured output
 */
function getOpenEndedFunctionSchema() {
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


