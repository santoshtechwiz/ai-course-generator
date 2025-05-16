"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useQuiz } from "@/hooks/useQuizState"
import CodeQuizResult from "../../components/CodeQuizResult"
import { QuizSubmissionLoading } from "../../../components/QuizSubmissionLoading"

interface PageProps {
  params: {
    slug: string
  }
}

export default function Page({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter()
  const { data: session, status } = useSession()
  const { results, getResults } = useQuiz()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setError("Invalid quiz identifier.")
      setLoading(false)
      return
    }

    if (status === "authenticated") {
      getResults(slug)
        .catch((err) => {
          console.error("Failed to fetch results:", err)
          setError("We couldn't load your quiz results.")
        })
        .finally(() => setLoading(false))
    } else if (status !== "loading") {
      setLoading(false)
    }
  }, [status, slug, getResults])

  if (status === "unauthenticated") {
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/code/${slug}/results`)}`)
    return null
  }

  if (status === "loading" || loading) {
    return <QuizSubmissionLoading quizType="code" />
  }

  if (error || !results) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 max-w-xl mx-auto mt-10">
        <h2 className="text-lg font-semibold mb-2">Error Loading Results</h2>
        <p>{error}</p>
        <button
          onClick={() => router.push("/dashboard/quizzes")}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Return to Quizzes
        </button>
      </div>
    )
  }

  return <CodeQuizResult result={results} />
}
