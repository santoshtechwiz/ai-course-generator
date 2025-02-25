'use client'

import { QuizDetails, useQuizStructuredData } from "@/hooks/useQuizStructuredata"




export function QuizStructuredData({ quizDetails }: { quizDetails: QuizDetails }) {
  useQuizStructuredData(quizDetails)
  return null
}