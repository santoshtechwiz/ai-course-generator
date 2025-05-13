"use client"
import { useRouter } from "next/navigation"
import CodeQuizResultsPage from "./CodeQuizResultsPage"
import type { CodeQuizResultData } from "@/app/types/code-quiz-types"

// Update the QUIZ_STATE_STORAGE_KEY constant to be more specific
const QUIZ_STATE_STORAGE_KEY = "quiz_state_code_"

interface CodeQuizResultProps {
  result: CodeQuizResultData
}

export default function CodeQuizResult({ result }: CodeQuizResultProps) {
  const router = useRouter()

  const handleRestart = () => {
    router.push(`/dashboard/code/${result.slug}?reset=true`)
  }

  const handleReturn = () => {
    router.push("/dashboard/quizzes")
  }

  return <CodeQuizResultsPage result={result} onRestart={handleRestart} onReturn={handleReturn} />
}
