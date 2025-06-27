"use client"



import { BaseQuizResults } from "../../components/BaseTextQuizResult"



export default function BlankQuizResults({ result, onRetake, isAuthenticated = true, slug }: BlankQuizResultsProps) {
  return (
    <BaseQuizResults
      result={result}
      onRetake={onRetake}
      isAuthenticated={isAuthenticated}
      slug={slug}
      quizType="blanks"
    />
  )
}
