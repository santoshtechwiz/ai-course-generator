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
}

/**
 * Build video quiz generation prompt
 */
function buildVideoQuizPrompt(options: VideoPromptOptions): AIMessage[] {
  const { courseTitle, transcript, numberOfQuestions, difficulty = 'medium', quizType = 'mcq' } = options
  
  const systemMessage: AIMessage = {
    role: 'system',
    content: `You are an expert in creating educational quiz questions from video transcripts. 
Focus only on important concepts, key facts, and core knowledge presented in the content. 
Ignore introductions, speaker information, greetings, conclusions, and any meta-content about the video itself.`
  }
  
  const quizTypeInstructions = {
    mcq: `Generate ${numberOfQuestions} multiple-choice questions with 4 options each (1 correct, 3 incorrect).`,
    openended: `Generate ${numberOfQuestions} open-ended questions requiring detailed explanations.`,
    mixed: `Generate ${numberOfQuestions} questions mixing multiple-choice and open-ended formats.`,
  }
  
  const userMessage: AIMessage = {
    role: 'user',
    content: `Generate ${numberOfQuestions} ${difficulty} difficulty ${quizType} questions based on the course titled "${courseTitle}" using the following video transcript:

${transcript}

**Requirements:**
- ${quizTypeInstructions[quizType]}
- Focus ONLY on substantive educational content and core concepts
- Questions should test understanding of key concepts, not trivial details
- Ensure questions cover different aspects of the main topic
- Make questions clear, unambiguous, and test real understanding
- Avoid questions about who created the content, introductions, or video metadata
- For MCQ: Make options distinct and plausible (avoid "all of the above" type options)
- For open-ended: Require comprehensive answers demonstrating understanding`
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


