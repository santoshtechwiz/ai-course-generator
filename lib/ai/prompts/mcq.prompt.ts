/**
 * MCQ Quiz Prompt Templates
 * 
 * Templates for generating multiple choice question quizzes
 */

import type { AIMessage } from '@/lib/ai/interfaces'

interface MCQPromptOptions {
  topic: string
  numberOfQuestions: number
  difficulty: 'easy' | 'medium' | 'hard'
  isPremium?: boolean
}

/**
 * Build MCQ quiz generation prompt
 */
export function buildMCQPrompt(options: MCQPromptOptions): AIMessage[] {
  const { topic, numberOfQuestions, difficulty, isPremium = false } = options
  
  const systemMessage: AIMessage = isPremium
    ? {
        role: 'system',
        content: 'You are an expert AI that generates high-quality educational multiple choice questions with detailed explanations.',
      }
    : {
        role: 'system',
        content: 'You are an AI that generates educational multiple choice questions.',
      }
  
  const userMessage: AIMessage = isPremium
    ? {
        role: 'user',
        content: `Generate ${numberOfQuestions} advanced multiple choice questions about "${topic}" at ${difficulty} difficulty level. Each question should have 4 options with one correct answer and a detailed explanation.`,
      }
    : {
        role: 'user',
        content: `Generate ${numberOfQuestions} multiple choice questions about "${topic}" at ${difficulty} difficulty level. Each question should have 4 options with one correct answer.`,
      }
  
  return [systemMessage, userMessage]
}

/**
 * MCQ function schema for structured output
 */
export function getMCQFunctionSchema() {
  return {
    name: 'generate_mcq_quiz',
    description: 'Generates multiple choice questions with options and correct answers',
    parameters: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string', description: 'The question text' },
              options: {
                type: 'array',
                items: { type: 'string' },
                description: '4 answer options',
                minItems: 4,
                maxItems: 4,
              },
              correctAnswer: { type: 'number', description: 'Index of correct option (0-3)' },
              explanation: { type: 'string', description: 'Explanation of the correct answer' },
            },
            required: ['question', 'options', 'correctAnswer'],
          },
        },
      },
      required: ['questions'],
    },
  }
}

/**
 * Build MCQ prompt with function schema included
 */
export function buildMCQPromptWithSchema(options: MCQPromptOptions) {
  return {
    messages: buildMCQPrompt(options),
    functions: [getMCQFunctionSchema()],
    functionCall: { name: 'generate_mcq_quiz' },
  }
}


