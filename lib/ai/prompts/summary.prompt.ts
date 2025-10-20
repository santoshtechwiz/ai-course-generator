/**
 * Summary Generation Prompt Templates
 * 
 * Templates for generating summaries from transcripts and text content
 */

import type { AIMessage } from '@/lib/ai/interfaces'

export interface SummaryPromptOptions {
  transcript: string
  summaryLength?: number
  focusAreas?: string[]
}

/**
 * Build summary generation prompt
 */
export function buildSummaryPrompt(options: SummaryPromptOptions): AIMessage[] {
  const { transcript, summaryLength = 250, focusAreas = [] } = options
  
  const focusInstruction = focusAreas.length > 0
    ? `\n- Focus particularly on: ${focusAreas.join(', ')}`
    : ''
  
  return [
    {
      role: 'system',
      content: `You are an AI capable of summarizing content clearly and concisely. 
Create summaries that capture the main topic and key points while avoiding tangential details.`
    },
    {
      role: 'user',
      content: `Summarize the following transcript in approximately ${summaryLength} words.
${focusInstruction}

**Requirements:**
- Focus on the main topic and key points
- Avoid mentioning sponsors, introductions, or unrelated details
- Make it clear and easy to understand
- Highlight the most important concepts
- Use professional language

**Transcript:**
${transcript}`
    }
  ]
}

/**
 * Summary function schema for structured output
 */
export function getSummaryFunctionSchema() {
  return {
    name: 'generate_summary',
    description: 'Generates a concise summary of the transcript',
    parameters: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'The generated summary'
        },
        keyPoints: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of key points from the content (optional)'
        },
        mainTopic: {
          type: 'string',
          description: 'The main topic or subject of the content (optional)'
        }
      },
      required: ['summary']
    }
  }
}

/**
 * Build summary prompt with function schema included
 */
export function buildSummaryPromptWithSchema(options: SummaryPromptOptions) {
  return {
    messages: buildSummaryPrompt(options),
    functions: [getSummaryFunctionSchema()],
    functionCall: { name: 'generate_summary' },
  }
}

/**
 * Estimate token count for transcript
 * Used to determine if truncation is needed
 */
export function estimateTokenCount(text: string): number {
  const averageTokensPerWord = 1.33
  const wordCount = text.split(/\s+/).length
  return Math.ceil(wordCount * averageTokensPerWord)
}

/**
 * Truncate transcript to fit within token limits
 */
export function truncateTranscript(transcript: string, maxTokens: number): string {
  const words = transcript.split(/\s+/)
  let tokenCount = 0
  const truncatedWords: string[] = []

  for (const word of words) {
    const estimatedTokens = estimateTokenCount(word)
    if (tokenCount + estimatedTokens > maxTokens) break
    tokenCount += estimatedTokens
    truncatedWords.push(word)
  }

  return truncatedWords.join(' ')
}

export default {
  buildSummaryPrompt,
  getSummaryFunctionSchema,
  buildSummaryPromptWithSchema,
  estimateTokenCount,
  truncateTranscript,
}
