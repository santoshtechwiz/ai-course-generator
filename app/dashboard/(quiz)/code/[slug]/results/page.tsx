"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useQuiz } from "@/hooks/useQuizState"
import CodeQuizResult from "../../components/CodeQuizResult"


export default function ResultsPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const { data: session, status } = useSession()
  const router = useRouter()
  const { results, getResults } = useQuiz()

  useEffect(() => {
    if (status === "authenticated" && slug) {
      getResults(slug).catch((err) => {
        console.error("Failed to fetch results:", err)
        // Optional: Redirect or show error
      })
    }
  }, [status, slug, getResults])

  if (status === "loading") return <p>Loading...</p>

  if (status === "unauthenticated") {
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/code/${slug}/results`)}`)
    return null
  }

  if (!results) return <p>Loading results...</p>

  return <CodeQuizResult result={results} />
}
