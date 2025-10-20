/**
 * Course Content Prompt Templates
 * 
 * Templates for generating complete course content
 */

import type { AIMessage } from '@/lib/ai/interfaces'

export interface CoursePromptOptions {
  topic: string
  numberOfModules: number
  difficulty: 'easy' | 'medium' | 'hard'
  includeQuizzes?: boolean
}

/**
 * Build course content generation prompt
 */
export function buildCoursePrompt(options: CoursePromptOptions): AIMessage[] {
  const { topic, numberOfModules, difficulty, includeQuizzes = false } = options
  
  return [
    {
      role: 'system',
      content: 'You are an expert curriculum designer that creates comprehensive, well-structured course content with learning objectives, modules, and assessments. Design courses that provide clear learning paths.',
    },
    {
      role: 'user',
      content: `Create a complete course about "${topic}" with ${numberOfModules} modules at ${difficulty} difficulty. ${includeQuizzes ? 'Include quiz questions for each module.' : ''}

**Requirements:**
- Define clear learning objectives for the entire course
- Structure ${numberOfModules} progressive modules (beginner to advanced)
- Each module should include:
  - Module title and description
  - Learning objectives
  - Key concepts to cover
  - Practical examples or exercises
  ${includeQuizzes ? '- 3-5 quiz questions to test understanding' : ''}
- Ensure logical progression between modules
- Include recommended time estimates for each module`,
    },
  ]
}

/**
 * Course content function schema for structured output
 */
export function getCourseFunctionSchema() {
  return {
    name: 'generate_course_content',
    description: 'Generates complete course content with modules and learning objectives',
    parameters: {
      type: 'object',
      properties: {
        courseTitle: { type: 'string' },
        description: { type: 'string' },
        learningObjectives: {
          type: 'array',
          items: { type: 'string' },
        },
        modules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moduleNumber: { type: 'number' },
              title: { type: 'string' },
              description: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              keyConcepts: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string', description: 'Estimated time' },
              quiz: {
                type: 'array',
                items: { type: 'object' },
                description: 'Optional quiz questions'
              },
            },
            required: ['moduleNumber', 'title', 'description', 'objectives'],
          },
        },
      },
      required: ['courseTitle', 'description', 'learningObjectives', 'modules'],
    },
  }
}

/**
 * Build course prompt with function schema included
 */
export function buildCoursePromptWithSchema(options: CoursePromptOptions) {
  return {
    messages: buildCoursePrompt(options),
    functions: [getCourseFunctionSchema()],
    functionCall: { name: 'generate_course_content' },
  }
}

export default {
  buildCoursePrompt,
  getCourseFunctionSchema,
  buildCoursePromptWithSchema,
}
