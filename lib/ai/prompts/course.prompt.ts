/**
 * Course Content Prompt Templates
 *
 * Templates for generating complete course content with chapters
 */

import type { AIMessage } from '@/lib/ai/interfaces'

interface CoursePromptOptions {
  title: string
  units: string[]
}

/**
 * Build course content generation prompt
 */
export function buildCoursePrompt(options: CoursePromptOptions): AIMessage[] {
  const { title, units } = options

  const systemMessage: AIMessage = {
    role: 'system',
    content: 'You are an expert AI that creates structured course outlines with relevant chapter titles and YouTube search queries for each chapter.',
  }

  const userMessage: AIMessage = {
    role: 'user',
    content: `Create a comprehensive course about "${title}".
The course should cover the following units: ${units.join(', ')}.
For each unit, generate chapters with:
- chapter_title: A clear, descriptive title for the chapter
- youtube_search_query: A detailed search query that will find high-quality instructional videos for this chapter topic

Structure the course logically from basic to advanced concepts.`,
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
