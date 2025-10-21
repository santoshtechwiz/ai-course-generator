/**
 * Document Quiz Prompt Templates
 * 
 * Templates for generating quizzes from document content
 */

import type { AIMessage } from '@/lib/ai/interfaces'

interface DocumentPromptOptions {
  documentText: string
  numberOfQuestions: number
  quizType: 'mcq' | 'openended' | 'mixed'
}

/**
 * Build document quiz generation prompt
 */
export function buildDocumentPrompt(options: DocumentPromptOptions): AIMessage[] {
  const { documentText, numberOfQuestions, quizType } = options
  
  const quizTypeInstructions = {
    mcq: 'Generate multiple choice questions with 4 options each.',
    openended: 'Generate open-ended questions requiring detailed answers.',
    mixed: 'Generate a mix of multiple choice and open-ended questions.',
  }
  
  return [
    {
      role: 'system',
      content: 'You are an expert quiz generator that creates relevant questions based on provided documents. Extract key concepts and create questions that test comprehension and retention.',
    },
    {
      role: 'user',
      content: `Based on this document, generate ${numberOfQuestions} ${quizType} questions:

${documentText}

**Requirements:**
- ${quizTypeInstructions[quizType]}
- Focus on main concepts, key facts, and important details
- Questions should test both understanding and recall
- Cover different sections of the document
- Ensure answers can be found in or inferred from the document
- Provide explanations or references to document sections`,
    },
  ]
}

/**
 * Document quiz function schema for structured output
 */
function getDocumentQuizFunctionSchema(quizType: 'mcq' | 'openended' | 'mixed') {
  const baseQuestion = {
    question: { type: 'string', description: 'The question text' },
    reference: { 
      type: 'string',
      description: 'Section or paragraph from document this question relates to'
    },
  }
  
  const mcqProperties = {
    ...baseQuestion,
    options: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
    correctAnswer: { type: 'number' },
    explanation: { type: 'string' },
  }
  
  const openEndedProperties = {
    ...baseQuestion,
    sampleAnswer: { type: 'string' },
    keyPoints: { type: 'array', items: { type: 'string' } },
  }
  
  return {
    name: 'generate_document_quiz',
    description: 'Generates quiz questions based on document content',
    parameters: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: quizType === 'mcq' ? mcqProperties : 
                       quizType === 'openended' ? openEndedProperties :
                       { ...mcqProperties, ...openEndedProperties, type: { type: 'string', enum: ['mcq', 'openended'] } },
          },
        },
      },
      required: ['questions'],
    },
  }
}

/**
 * Build document prompt with function schema included
 */
export function buildDocumentPromptWithSchema(options: DocumentPromptOptions) {
  return {
    messages: buildDocumentPrompt(options),
    functions: [getDocumentQuizFunctionSchema(options.quizType)],
    functionCall: { name: 'generate_document_quiz' },
  }
}


