import type { QuizResult, QuizQuestion, UserAnswer } from "@/app/types/quiz-types"

interface ResultsPreviewParams {
  questions: QuizQuestion[]
  answers: UserAnswer[]
  quizTitle: string
  slug: string
}

export function createResultsPreview({
  questions,
  answers,
  quizTitle,
  slug,
}: ResultsPreviewParams): QuizResult {
  const correctAnswers = answers.filter(a => a.isCorrect).length
  
  return {
    quizId: slug,
    slug,
    title: quizTitle,
    score: correctAnswers,
    maxScore: questions.length,
    percentage: (correctAnswers / questions.length) * 100,
    questions: questions.map(q => ({
      id: q.id,
      question: q.question,
      userAnswer: answers.find(a => a.questionId === q.id)?.answer || '',
      correctAnswer: q.correctAnswer || q.answer || '',
      isCorrect: answers.find(a => a.questionId === q.id)?.isCorrect || false,
      codeSnippet: q.codeSnippet,
    })),
    completedAt: new Date().toISOString()
  }
}
