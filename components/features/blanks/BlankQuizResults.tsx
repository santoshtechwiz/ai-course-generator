"use client"
import React, { useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface BlankQuizResultsProps {
  answers: { answer: string; timeSpent: number; hintsUsed: boolean }[]
  questions: { id: number; question: string; answer: string }[]
  onRestart: () => void
  onComplete: (score: number) => void
}

export default function BlankQuizResults({ answers, questions, onRestart, onComplete }: BlankQuizResultsProps) {
  const { score, results } = useMemo(() => {
    const calculatedResults = questions.map((question, index) => {
      const userAnswer = answers[index].answer.trim().toLowerCase()
      const correctAnswer = question.answer.trim().toLowerCase()
      const similarity = calculateSimilarity(correctAnswer, userAnswer)
      return {
        ...question,
        userAnswer: answers[index].answer.trim(), // Preserve original case for display
        correctAnswer: question.answer, // Preserve original case for display
        similarity,
        timeSpent: answers[index].timeSpent,
      }
    })

    const totalScore = calculatedResults.reduce((acc, result) => acc + result.similarity, 0)
    const averageScore = Math.min(100, totalScore / questions.length)

    return { score: averageScore, results: calculatedResults }
  }, [answers, questions])

  const hasCalledComplete = useRef(false)

  useEffect(() => {
    if (!hasCalledComplete.current) {
      hasCalledComplete.current = true
      onComplete(score)
    }
  }, [score, onComplete])

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">Quiz Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <p className="text-3xl font-bold mb-2">{score.toFixed(1)}%</p>
            <Progress value={score} className="w-full h-2" />
          </div>
          {results.map((result, index) => (
            <Card key={result.id} className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Question {index + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2">{result.question}</p>
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <strong className="min-w-[120px]">Your Answer:</strong>
                    <span className={getAnswerClassName(result.similarity)}>{result.userAnswer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <strong className="min-w-[120px]">Correct Answer:</strong>
                    <span>{result.correctAnswer}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {result.similarity === 100 ? (
                    <CheckCircle className="text-green-500" />
                  ) : result.similarity > 80 ? (
                    <AlertTriangle className="text-yellow-500" />
                  ) : (
                    <XCircle className="text-red-500" />
                  )}
                  <span>Accuracy: {result.similarity.toFixed(1)}%</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Time spent: {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s
                </p>
              </CardContent>
            </Card>
          ))}
          <div className="flex justify-center mt-6">
            <Button onClick={onRestart}>Restart Quiz</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function calculateSimilarity(str1: string, str2: string): number {
  // Normalize strings by removing extra spaces and converting to lowercase
  const normalize = (str: string) => str.replace(/\s+/g, " ").trim().toLowerCase()
  const normalizedStr1 = normalize(str1)
  const normalizedStr2 = normalize(str2)

  if (normalizedStr1 === normalizedStr2) return 100

  const longer = normalizedStr1.length > normalizedStr2.length ? normalizedStr1 : normalizedStr2
  const shorter = normalizedStr1.length > normalizedStr2.length ? normalizedStr2 : normalizedStr1
  const longerLength = longer.length

  if (longerLength === 0) return 100

  const editDistance = levenshteinDistance(longer, shorter)
  return Math.round(Math.max(0, Math.min(100, (1 - editDistance / longerLength) * 100)))
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]) + 1
      }
    }
  }

  return dp[m][n]
}

function getAnswerClassName(similarity: number): string {
  if (similarity === 100) return "text-green-600 dark:text-green-400"
  if (similarity > 80) return "text-yellow-600 dark:text-yellow-400"
  return "text-red-600 dark:text-red-400"
}

