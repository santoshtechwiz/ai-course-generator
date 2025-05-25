"use client"

import React from "react"
import { use } from "react"
import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"
import CodeQuizWrapper from "../components/CodeQuizWrapper"
import { useAuth } from "@/hooks/useAuth"

interface CodeQuizPageProps {
  params: Promise<{ slug: string }> | { slug: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function CodeQuizPage({ params }: CodeQuizPageProps) {
  // Always unwrap params using React.use() for future compatibility
  const slug = params instanceof Promise ? use(params).slug : params.slug

  // Use unified auth hook for consistency
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()

  // Show loading while checking auth
  if (authLoading) {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Checking authentication", status: "loading" },
          { label: "Preparing quiz", status: "pending" },
        ]}
      />
    )
  }

  // Render the Redux-powered quiz wrapper
  return (
    <div className="container max-w-4xl py-6">
      <CodeQuizWrapper slug={slug} userId={user?.id} />
    </div>
  )
}
