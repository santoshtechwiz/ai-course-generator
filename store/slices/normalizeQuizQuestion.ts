// utils/normalizeQuizQuestion.ts

import type { QuizQuestion, QuizType } from "@/types/quiz"

export function normalizeQuizQuestion(q: any, type: QuizType): QuizQuestion {
  const open = q.openEndedQuestion || {}

  const base: QuizQuestion = {
    id: q.id || crypto.randomUUID(),
    question: q.question,
    type,
    answer: q.answer,
    codeSnippet: q.codeSnippet,
    language: q.language || "javascript",
    tags: type === "blanks" || type === "openended" ? open.tags || [] : q.tags || [],
    hints: type === "blanks" || type === "openended" ? open.hints || [] : q.hints || [],
    difficulty: q.difficulty,
    keywords: q.keywords,
  }

  if (type === "mcq") {
    return {
      ...base,
      options: q.options,
      correctOptionId: q.correctOptionId,
    }
  }

  if (type === "code") {
    return {
      ...base,
      options: q.options,
    }
  }

  return base
}
