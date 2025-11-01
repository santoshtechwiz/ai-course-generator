/**
 * Video Quiz Prompt Templates
 * 
 * Templates for generating quiz questions from video transcripts
 */

import type { AIMessage } from '@/lib/ai/interfaces'

interface VideoPromptOptions {
  courseTitle: string
  transcript: string
  numberOfQuestions: number
  difficulty?: 'easy' | 'medium' | 'hard'
  quizType?: 'mcq' | 'openended' | 'mixed'
  isSubscribed?: boolean
}

/**
 * Build video quiz generation prompt
 */
function buildVideoQuizPrompt(options: VideoPromptOptions): AIMessage[] {
  const { courseTitle, transcript, numberOfQuestions, difficulty = 'medium', quizType = 'mcq', isSubscribed = false } = options
  
  const systemMessage: AIMessage = {
    role: 'system',
    content: `You are an expert AI educator creating high-quality educational quiz questions from video transcripts.

Focus ONLY on substantive educational content - ignore introductions, speaker info, greetings, conclusions, and video metadata.

${isSubscribed ? 'For premium users: emphasize deeper analysis, critical thinking, and comprehensive understanding.' : 'Create clear, focused questions that test core concepts.'}`
  }
  
  const quizTypeInstructions = {
    mcq: `Generate ${numberOfQuestions} multiple-choice questions with 4 options each (1 correct, 3 incorrect).`,
    openended: `Generate ${numberOfQuestions} open-ended questions requiring detailed explanations.`,
    mixed: `Generate ${numberOfQuestions} questions mixing multiple-choice and open-ended formats.`,
  }
  
  const userMessage: AIMessage = {
    role: 'user',
    content: `Generate ${numberOfQuestions} ${difficulty} ${quizType} questions from "${courseTitle}" using this transcript:

${transcript}

Requirements:
- ${quizTypeInstructions[quizType]}
- Focus ONLY on core educational content
- Questions should test real understanding of key concepts
- Avoid meta-content about the video or speaker
- MCQ: 4 distinct, plausible options${isSubscribed ? '\n- Include advanced analysis questions\n- Add critical thinking and application questions' : ''}`
  }
  
  return [systemMessage, userMessage]
}

/**
 * Video quiz function schema for structured output (MCQ format)
 */
export function getVideoQuizMCQFunctionSchema() {
  return {
    name: 'generate_video_quiz_mcq',
    description: 'Generates multiple-choice questions from video transcript',
    parameters: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { 
                type: 'string',
                description: 'The question text based on video content'
              },
              answer: { 
                type: 'string',
                description: 'The correct answer'
              },
              options: {
                type: 'array',
                items: { type: 'string' },
                description: '4 answer options including the correct one',
                minItems: 4,
                maxItems: 4,
              },
              explanation: {
                type: 'string',
                description: 'Why this answer is correct (optional)'
              },
              timestampReference: {
                type: 'string',
                description: 'Approximate timestamp in video where this topic is covered (optional)'
              }
            },
            required: ['question', 'answer', 'options'],
          },
        },
      },
      required: ['questions'],
    },
  }
}


/**
 * Build video quiz prompt with function schema included (MCQ format)
 */
export function buildVideoQuizPromptWithSchema(options: VideoPromptOptions) {
  return {
    messages: buildVideoQuizPrompt(options),
    functions: [getVideoQuizMCQFunctionSchema()],
    functionCall: { name: 'generate_video_quiz_mcq' },
  }
}


