/**
 * Code Quiz Prompt Templates
 * 
 * Templates for generating code-based quiz questions
 */

import type { AIMessage } from '@/lib/ai/interfaces'

interface CodePromptOptions {
  topic: string
  numberOfQuestions: number
  programmingLanguage: string
  difficulty: 'easy' | 'medium' | 'hard'
  isSubscribed?: boolean
}

/**
 * Build code quiz generation prompt
 */
export function buildCodePrompt(options: CodePromptOptions): AIMessage[] {
  const { topic, numberOfQuestions, programmingLanguage, difficulty, isSubscribed = false } = options
  
  const systemMessage: AIMessage = isSubscribed
    ? {
        role: 'system',
        content: 'You are an expert AI programming instructor that generates high-quality, comprehensive code-based quiz questions with working code examples, detailed explanations, and advanced coding scenarios. Focus on practical coding scenarios, best practices, and complex problem-solving.',
      }
    : {
        role: 'system',
        content: 'You are an expert programming instructor that generates code-based quiz questions with working code examples. Focus on practical coding scenarios and best practices.',
      }
  
  return [
    systemMessage,
    {
      role: 'user',
      content: `Generate ${numberOfQuestions} coding quiz questions about "${topic}" in ${programmingLanguage} at ${difficulty} difficulty.

**Requirements:**
- Include code snippets in each question
- Ask about output, behavior, or best practices
- Code should be syntactically correct and runnable
- Questions should test practical understanding, not just theory
- Cover different aspects: syntax, logic, debugging, optimization
- Provide detailed explanations for correct answers${isSubscribed ? '\n- Include advanced coding patterns and design principles\n- Add questions requiring code analysis and refactoring\n- Include performance optimization and best practices scenarios\n- Provide multiple solution approaches where applicable' : ''}`,
    },
  ]
}

/**
 * Build code quiz prompt with function schema included
 */
export function buildCodeQuizPromptWithSchema(options: CodePromptOptions) {
  return {
    messages: buildCodePrompt(options),
    functions: [getCodeFunctionSchema()],
    functionCall: { name: 'generate_code_quiz' },
  }
}

/**
 * Code quiz function schema for structured output
 */
function getCodeFunctionSchema() {
  return {
    name: 'generate_code_quiz',
    description: 'Generates code-based quiz questions with code snippets',
    parameters: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string', description: 'The question text' },
              code: { type: 'string', description: 'Code snippet related to question' },
              options: {
                type: 'array',
                items: { type: 'string' },
                description: '4 answer options',
              },
              correctAnswer: { type: 'number', description: 'Index of correct option' },
              explanation: { type: 'string', description: 'Detailed explanation' },
            },
            required: ['question', 'code', 'options', 'correctAnswer', 'explanation'],
          },
        },
      },
      required: ['questions'],
    },
  }
}


