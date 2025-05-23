import type { QuizType, UserAnswer, QuizQuestionResult } from "@/app/types/quiz-types"
import type { BaseQuizResultData } from "@/app/types/quiz-base"

interface ResultsPreviewParams<T = any> {
  questions: T[]
  answers: UserAnswer[]
  quizTitle: string
  slug: string
  type: QuizType
}

export function createResultsPreview({
  questions,
  answers,
  quizTitle,
  slug,
  type,
}: ResultsPreviewParams): BaseQuizResultData {
  if (!Array.isArray(questions) || !Array.isArray(answers)) {
    throw new Error("Invalid questions or answers array")
  }

  const processedQuestions: QuizQuestionResult[] = questions.map((q) => ({
    id: q.id,
    question: q.question,
    userAnswer: answers.find((a) => a.questionId === q.id)?.answer || "",
    correctAnswer: "correctAnswer" in q ? q.correctAnswer : 
                  "answer" in q ? q.answer : "",
    isCorrect: Boolean(answers.find((a) => a.questionId === q.id)?.isCorrect),
    codeSnippet: "codeSnippet" in q ? q.codeSnippet : undefined,
    type
  }))

  return {
    quizId: slug,
    slug,
    title: quizTitle,
    score: answers.filter((a) => a.isCorrect).length,
    maxScore: questions.length,
    percentage: (answers.filter((a) => a.isCorrect).length / questions.length) * 100,
    questions: processedQuestions,
    answers,
    completedAt: new Date().toISOString(),
    type
  }
}
