"use client"

import { BaseQuizResults } from "../../components/BaseTextQuizResult"



export default function OpenEndedQuizResults({ result, onRetake, isAuthenticated = true, slug }: Props) {
  return (
    <BaseQuizResults
      result={result}
      onRetake={onRetake}
      isAuthenticated={isAuthenticated}
      slug={slug}
      quizType="open-ended"
    />
  )
}
