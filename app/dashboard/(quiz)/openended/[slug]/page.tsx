"use client"

import { use } from "react"
import { useAuth } from "@/hooks/useAuth"
import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"
import OpenEndedQuizWrapper from "../components/OpenEndedQuizWrapper"


interface OpenEndedQuizPageProps {
  params: {
    slug: string;
  };
}

export default function OpenEndedQuizPage({ params }: OpenEndedQuizPageProps) {
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
      <OpenEndedQuizWrapper slug={slug} />
    </div>
  )
}

