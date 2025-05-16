"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { QuizSubmissionLoading } from "../../components/QuizSubmissionLoading"
import type { CodeQuizResultData } from "@/app/types/code-quiz-types"

interface CodeQuizResultProps {
  result: CodeQuizResultData
}

export default function CodeQuizResult({ result }: CodeQuizResultProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (!result) {
    console.error("CodeQuizResult: result is null or undefined")
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 max-w-xl mx-auto mt-10">
        <h2 className="text-lg font-semibold mb-2">Error Loading Results</h2>
        <p>We couldn't load your quiz results. Please try again.</p>
        <button
          onClick={() => router.push("/dashboard/quizzes")}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Return to Quizzes
        </button>
      </div>
    )
  }

  if (isLoading) {
    return <QuizSubmissionLoading quizType="code" />
  }

  const slug = result.slug || ""

  const handleRestart = () => {
    router.push(`/dashboard/code/${slug}`)
  }

  const handleReturn = () => {
    router.push("/dashboard/quizzes")
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Quiz Results</h1>
      <p className="text-gray-700 mb-2">Quiz: {result.title}</p>
      <p className="text-gray-700 mb-2">Score: {result.score} / {result.total}</p>
      <p className="text-gray-700 mb-6">Completed at: {new Date(result.completedAt).toLocaleString()}</p>

      <div className="flex gap-4">
        <button
          onClick={handleRestart}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry Quiz
        </button>
        <button
          onClick={handleReturn}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Return to Dashboard
        </button>
      </div>

      {/* Optional: Detailed questions & answers */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Your Answers</h2>
        {result.questions.map((q, i) => (
          <div key={i} className="mb-4 p-4 border rounded-md bg-gray-50">
            <p className="font-medium">Q{i + 1}: {q.question}</p>
            <p className="text-sm text-gray-600">
              Your answer: {q.userAnswer} {q.isCorrect ? "✅" : "❌"}
            </p>
            {!q.isCorrect && (
              <p className="text-sm text-green-700">Correct answer: {q.correctAnswer}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
