"use client"
import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { diffChars } from "diff"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface QuizResultsProps {
  answers: { answer: string; timeSpent: number; hintsUsed: boolean }[]
  questions: { id: number; question: string; answer: string }[]
  onRestart: () => void
  onComplete: (score: number) => void
}

export default function QuizResults({ answers, questions, onRestart, onComplete }: QuizResultsProps) {
  const [score, setScore] = React.useState<number | null>(null)

  React.useEffect(() => {
    const calculatedScore = calculateScore(answers, questions)
    setScore(calculatedScore)
    onComplete(calculatedScore)
  }, [answers, questions, onComplete])

  const calculateScore = (answers: { answer: string }[], questions: { answer: string }[]): number => {
    const totalScore = answers.reduce((acc, answer, index) => {
      const correctAnswer = questions[index].answer.toLowerCase()
      const userAnswer = answer.answer.toLowerCase()
      const similarity = calculateSimilarity(correctAnswer, userAnswer)
      return acc + similarity
    }, 0)

    // Ensure the score doesn't exceed 100%
    return Math.min(100, totalScore / questions.length)
  }

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    const longerLength = longer.length
    if (longerLength === 0) {
      return 100
    }
    const editDistance = levenshteinDistance(longer, shorter)
    return Math.max(0, Math.min(100, (1 - editDistance / longerLength) * 100))
  }

  const levenshteinDistance = (str1: string, str2: string): number => {
    const m = str1.length
    const n = str2.length
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

    for (let i = 0; i <= m; i++) {
      dp[i][0] = i
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j
    }

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

  const renderDiff = (correct: string, user: string) => {
    const diff = diffChars(correct.toLowerCase(), user.toLowerCase())
    return diff.map((part, index) => (
      <span
        key={index}
        className={part.added ? "bg-red-200 dark:bg-red-800" : part.removed ? "bg-green-200 dark:bg-green-800" : ""}
      >
        {part.value}
      </span>
    ))
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">Quiz Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <p className="text-3xl font-bold mb-2">{score !== null ? `${score.toFixed(1)}%` : "Calculating..."}</p>
            <Progress value={score || 0} className="w-full h-2" />
          </div>
          {questions.map((question, index) => (
            <Card key={question.id} className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Question {index + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2">{question.question}</p>
                <div className="flex items-center gap-2 mb-2">
                  <strong>Your Answer:</strong>
                  {renderDiff(question.answer, answers[index].answer)}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <strong>Correct Answer:</strong> {question.answer}
                </div>
                <div className="flex items-center gap-2">
                  {calculateSimilarity(question.answer, answers[index].answer) === 100 ? (
                    <CheckCircle className="text-green-500" />
                  ) : calculateSimilarity(question.answer, answers[index].answer) > 80 ? (
                    <AlertTriangle className="text-yellow-500" />
                  ) : (
                    <XCircle className="text-red-500" />
                  )}
                  <span>Accuracy: {calculateSimilarity(question.answer, answers[index].answer).toFixed(1)}%</span>
                </div>
                <p className="text-sm text-gray-500">
                  Time spent: {Math.floor(answers[index].timeSpent / 60)}m {answers[index].timeSpent % 60}s
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

