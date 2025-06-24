/**
 * Unified quiz utilities
 */

import { ProcessedAnswer, QuestionOption } from "../components/quiz-result-types"

/**
 * Process and normalize user answers from different quiz result formats
 */
export function processQuizAnswers(result: any): ProcessedAnswer[] {
  if (!result) return []
  
  // Support both questionResults (newer API) and results (older API)
  const resultsArray = result.questionResults || result.results || []
  
  // Handle missing question results
  if (!Array.isArray(resultsArray) || resultsArray.length === 0) {
    return []
  }

  return resultsArray.map((q: any) => {
    // Process options with type safety
    const options = q.options || []
    
    // Normalize all options to have consistent structure
    const normalizedOptions = options.map((opt: any) => 
      typeof opt === 'string' 
        ? { id: opt, text: opt, value: opt }
        : { id: opt.id, text: opt.text || '', value: opt.value || opt.text || '' }
    )
    
    // Find user and correct answer IDs
    const userAnswerId = normalizedOptions.find((opt: QuestionOption) => 
      opt.text === q.userAnswer
    )?.id || q.selectedOptionId || ''
    
    const correctAnswerId = normalizedOptions.find((opt: QuestionOption) => 
      opt.text === q.correctAnswer
    )?.id || ''

    // For code questions, include code snippet
    const hasCodeSnippet = q.type === 'code' || q.codeSnippet

    return {
      questionId: q.questionId || q.id || `q-${Math.random().toString(36).substring(2, 9)}`,
      question: q.question || q.text || '',
      userAnswer: q.userAnswer || '(No answer selected)',
      correctAnswer: q.correctAnswer || '',
      isCorrect: q.isCorrect || false,
      type: q.type || 'mcq',
      options: normalizedOptions,
      allOptions: normalizedOptions,
      userAnswerId,
      correctAnswerId,
      // Include code-specific properties
      codeSnippet: q.codeSnippet || '',
      language: q.language || 'javascript',
      explanation: q.explanation || '',
      difficulty: q.difficulty || '',
      category: q.category || '',
      // Calculate time spent if available
      timeSpent: q.timeSpent || (result.totalTime ? result.totalTime / Math.max(result.questionResults.length, 1) : 0)
    }
  })
}
