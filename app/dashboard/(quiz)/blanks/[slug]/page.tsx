"use client"

import { use } from "react"
import { useAuth } from "@/hooks/useAuth"
import BlankQuizWrapper from "../components/BlankQuizWrapper"

import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"

export default function BlanksPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  // Extract slug for both test and production environments
  const slug = params instanceof Promise ? use(params).slug : params.slug
  
  // Custom hook for auth status
  const { isAuthenticated, isLoading } = useAuth()

  // If still loading auth status, show loading
  if (isLoading) {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Checking authentication", status: "loading" }
        ]}
      />
    )
  }

  return (
    <div className="container max-w-4xl py-6">
      <BlankQuizWrapper slug={slug} />
    </div>
  )
}
