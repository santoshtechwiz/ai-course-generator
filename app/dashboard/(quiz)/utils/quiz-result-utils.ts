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
    
    // Normalize all options to have consistent structure (ensure ids and texts are strings)
    const normalizedOptions = options.map((opt: any) => {
      if (typeof opt === 'string') {
        return { id: String(opt), text: String(opt), value: String(opt) }
      }
      return {
        id: String(opt.id ?? opt.value ?? opt.text ?? ''),
        text: String(opt.text ?? opt.value ?? ''),
        value: String(opt.value ?? opt.text ?? '')
      }
    })
    
    // Resolve user answer (could be option id, value, or text)
    const rawUser = q.userAnswer ?? q.selectedOptionId ?? ''
    const userOption = normalizedOptions.find((opt: QuestionOption) => {
      const target = String(rawUser)
      return String(opt.id) === target || String(opt.value) === target || String(opt.text) === target
    })
    const userAnswerId = userOption?.id || String(q.selectedOptionId ?? '')
    const userAnswerText = userOption?.text || (typeof q.userAnswer === 'string' ? q.userAnswer : '') || '(No answer selected)'
    
    // Resolve correct answer (could be option id, value, or text)
    const rawCorrect = q.correctAnswer ?? q.correctOptionId ?? q.answer ?? ''
    const correctOption = normalizedOptions.find((opt: QuestionOption) => {
      const target = String(rawCorrect)
      return String(opt.id) === target || String(opt.value) === target || String(opt.text) === target
    })
    const correctAnswerId = correctOption?.id || ''
    const correctAnswerText = correctOption?.text || (typeof q.correctAnswer === 'string' ? q.correctAnswer : '') || ''

    // For code questions, include code snippet and language if available
    const hasCodeSnippet = q.type === 'code' || Boolean(q.codeSnippet)

    return {
      questionId: q.questionId || q.id || `q-${Math.random().toString(36).substring(2, 9)}`,
      question: q.question || q.text || '',
      userAnswer: userAnswerText,
      correctAnswer: correctAnswerText,
      isCorrect: Boolean(q.isCorrect),
      type: q.type || 'mcq',
      options: normalizedOptions,
      allOptions: normalizedOptions,
      userAnswerId,
      correctAnswerId,
      // Include code-specific properties
      codeSnippet: hasCodeSnippet ? (q.codeSnippet || '') : undefined,
      language: hasCodeSnippet ? (q.language || 'javascript') : undefined,
      explanation: q.explanation || '',
      difficulty: q.difficulty || '',
      category: q.category || '',
      // Calculate time spent if available
      timeSpent: q.timeSpent || (result.totalTime ? result.totalTime / Math.max(result.questionResults?.length || resultsArray.length, 1) : 0)
    }
  })
}
