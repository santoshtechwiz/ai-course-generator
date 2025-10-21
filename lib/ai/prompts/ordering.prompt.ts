/**
 * Ordering Quiz Prompt Templates
 * 
 * Templates for generating ordering/sequencing quizzes
 */

import type { AIMessage } from '@/lib/ai/interfaces'

interface OrderingPromptOptions {
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  numberOfSteps?: number
  numberOfQuestions?: number
}

/**
 * Build ordering quiz generation prompt
 */
export function buildOrderingPrompt(options: OrderingPromptOptions): AIMessage[] {
  const { topic, difficulty, numberOfSteps = 5, numberOfQuestions = 3 } = options
  
  return [
    {
      role: 'system',
      content: 'You are an AI that generates ordering/sequencing quizzes for technical topics. Create clear, logical step-by-step processes that users must arrange in correct order.',
    },
    {
      role: 'user',
      content: `Generate an ordering quiz about "${topic}" with ${numberOfQuestions} separate questions at ${difficulty} difficulty level. Each question should have ${numberOfSteps} steps.

**Requirements for the quiz:**
- Generate exactly ${numberOfQuestions} different ordering questions
- Each question must have exactly ${numberOfSteps} sequential steps
- Each step must be a clear action or stage in the process
- Steps must be ordered correctly from first to last
- Provide a short, meaningful explanation for each step
- Ensure the steps form a coherent and complete workflow
- Each question should test different aspects of the topic

**Format each question as:**
- title: Brief title for the question
- description: What the user needs to arrange
- steps: Array of step objects with description and explanation

**Example topics:** Git Workflow, Docker Container Deployment, Database Backup Process, API Request Lifecycle, CI/CD Pipeline, etc.`,
    },
  ]
}

/**
 * Ordering quiz function schema for structured output
 */
export function getOrderingFunctionSchema() {
  return {
    name: 'generate_ordering_quiz',
    description: 'Generates multiple well-structured technical ordering quiz questions with complete steps and explanations',
    parameters: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          description: 'Array of ordering quiz questions',
          items: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Question title, e.g., "Docker Deployment Pipeline"',
              },
              description: {
                type: 'string',
                description: 'Short description of what needs to be ordered',
              },
              steps: {
                type: 'array',
                description: 'Array of steps to be ordered',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', description: 'Step ID (0-indexed)' },
                    description: { type: 'string', description: 'Step description' },
                    explanation: { type: 'string', description: 'Why this step is important' },
                  },
                  required: ['description'],
                },
              },
            },
            required: ['title', 'description', 'steps'],
          },
        },
      },
      required: ['questions'],
    },
  }
}

/**
 * Build ordering prompt with function schema included
 */
export function buildOrderingPromptWithSchema(options: OrderingPromptOptions) {
  return {
    messages: buildOrderingPrompt(options),
    functions: [getOrderingFunctionSchema()],
    functionCall: { name: 'generate_ordering_quiz' },
  }
}


