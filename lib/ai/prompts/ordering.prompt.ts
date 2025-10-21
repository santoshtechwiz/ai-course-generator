/**
 * Ordering Quiz Prompt Templates
 * 
 * Templates for generating ordering/sequencing quizzes
 */

import type { AIMessage } from '@/lib/ai/interfaces'

interface OrderingPromptOptions {
  topic: string
  numberOfSteps: number
  difficulty: 'easy' | 'medium' | 'hard'
}

/**
 * Build ordering quiz generation prompt
 */
export function buildOrderingPrompt(options: OrderingPromptOptions): AIMessage[] {
  const { topic, numberOfSteps, difficulty } = options
  
  return [
    {
      role: 'system',
      content: 'You are an AI that generates ordering/sequencing quizzes for technical topics. Create clear, logical step-by-step processes that users must arrange in correct order.',
    },
    {
      role: 'user',
      content: `Generate an ordering quiz about "${topic}" with ${numberOfSteps} steps at ${difficulty} difficulty. Users must arrange the steps in correct order.

**Requirements:**
- Create exactly ${numberOfSteps} sequential steps
- Each step must be a clear action or stage in the process
- Steps must be ordered correctly from first to last
- Provide a short, meaningful explanation for each step
- Ensure the steps form a coherent and complete workflow

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
    description: 'Generates a well-structured technical ordering quiz with complete steps and explanations',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Quiz title, e.g., "Docker Deployment Pipeline"',
        },
        description: {
          type: 'string',
          description: 'Short description of what the quiz tests',
        },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              description: { type: 'string', description: 'Step description' },
              explanation: { type: 'string', description: 'Why this step is important' },
            },
            required: ['description'],
          },
        },
        difficulty: {
          type: 'string',
          enum: ['easy', 'medium', 'hard'],
        },
      },
      required: ['title', 'description', 'steps', 'difficulty'],
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


