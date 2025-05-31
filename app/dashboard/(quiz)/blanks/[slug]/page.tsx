"use client"

import { use } from "react"
import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import BlanksQuizWrapper from "../components/BlanksQuizWrapper"
import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"

export default function BlanksQuizPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  const resolvedParams = params instanceof Promise ? use(params) : params
  const slug = resolvedParams.slug
  const { status: authStatus } = useSession()
  const router = useRouter()

  // Check for loading state
  if (authStatus === "loading") {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Initializing quiz", status: "loading" }
        ]}
      />
    )
  }

  if (!slug) {
    return (
      <div className="container max-w-4xl py-6">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Error</h2>
          <p className="text-muted-foreground">
            Quiz slug is missing. Please check the URL.
          </p>
        </div>
      </div>
    )
  }

  // Allow all users to take quiz (authenticated or not)
  return (
    <div className="container max-w-4xl py-6">
      <BlanksQuizWrapper slug={slug} />
    </div>
  )
}
