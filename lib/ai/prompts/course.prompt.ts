/**
 * Course Content Prompt Templates
 *
 * Templates for generating complete course content with chapters
 */

import type { AIMessage } from '@/lib/ai/interfaces'

interface CoursePromptOptions {
  title: string
  units: string[]
  isSubscribed?: boolean
}

/**
 * Build course content generation prompt
 */
export function buildCoursePrompt(options: CoursePromptOptions): AIMessage[] {
  const { title, units, isSubscribed = false } = options

  const systemMessage: AIMessage = {
    role: 'system',
    content: isSubscribed
      ? 'You are an expert AI educator that creates comprehensive, high-quality course outlines with detailed chapter titles, advanced learning objectives, and premium YouTube search queries for each chapter. Focus on creating in-depth, academically rigorous content.'
      : 'You are an expert AI that creates structured course outlines with relevant chapter titles and YouTube search queries for each chapter.',
  }

  const userMessage: AIMessage = {
  role: 'user',
  content: `Create a comprehensive course about "${title}".
The course should cover the following units: ${units.join(', ')}.

**Chapter Limit Rules:**
- Each unit must contain **no more than 3 chapters**
- If there is only one unit, generate **a maximum of 5 chapters total**
- If there are two or more units, generate **a maximum of 3 chapters per unit**
- Do not exceed these limits.

For each chapter, generate:
- chapter_title: A clear, descriptive title for the chapter
- youtube_search_query: A specific, high-quality search query to find good tutorial videos${isSubscribed ? '\n- learning_objectives: Specific learning goals for the chapter\n- key_concepts: Main concepts to be covered\n- difficulty_level: easy/medium/hard rating for the chapter' : ''}

Ensure the course flows logically from beginner to advanced${isSubscribed ? ' and includes progressive skill development' : ''}.
Return structured content only; no explanations.`,
}


  return [systemMessage, userMessage]
}

/**
 * Course function schema for structured output
 */
export function getCourseFunctionSchema() {
  return {
    name: 'generate_course_content',
    description: 'Generates course content with units and chapters with YouTube search queries',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the course' },
        units: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Title of the unit' },
              chapters: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    chapter_title: { type: 'string', description: 'Title of the chapter' },
                    youtube_search_query: { type: 'string', description: 'YouTube search query for finding relevant videos' },
                  },
                  required: ['chapter_title', 'youtube_search_query'],
                },
                description: 'Array of chapters for this unit',
              },
            },
            required: ['title', 'chapters'],
          },
          description: 'Array of course units with their chapters',
        },
      },
      required: ['title', 'units'],
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
