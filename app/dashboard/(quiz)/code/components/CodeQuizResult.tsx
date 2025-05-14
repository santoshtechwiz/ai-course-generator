"use client"
import { useRouter } from "next/navigation"
import CodeQuizResultsPage from "./CodeQuizResultsPage"
import type { CodeQuizResultData } from "@/app/types/code-quiz-types"

interface CodeQuizResultProps {
  result: CodeQuizResultData
}

export default function CodeQuizResult({ result }: CodeQuizResultProps) {
  const router = useRouter()

  // Validate result data
  if (!result) {
    console.error("CodeQuizResult: result is null or undefined")
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
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

  // Ensure slug is available
  const slug = result.slug || ""
  if (!slug) {
    console.error("CodeQuizResult: slug is missing in result data")
  }

  const handleRestart = () => {
    router.push(`/dashboard/code/${slug}`)
  }

  const handleReturn = () => {
    router.push("/dashboard/quizzes")
  }

  return <CodeQuizResultsPage result={result} onRestart={handleRestart} onReturn={handleReturn} />
}
