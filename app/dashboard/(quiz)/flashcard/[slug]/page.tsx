"use client"

import React, { use } from "react"
import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"
import FlashCardsPageClient from "../components/FlashCardsPageClient"
import { useAuth } from "@/hooks/useAuth"

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function FlashcardPage({ params }: PageProps) {
  // Always unwrap params using React.use() for future compatibility
  const slug = params instanceof Promise ? use(params).slug : (params as { slug: string }).slug

  // Use unified auth hook for consistency
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()

  // Show loading while checking auth
  if (authLoading) {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Checking authentication", status: "loading" },
          { label: "Preparing flashcards", status: "pending" },
        ]}
      />
    )
  }

  // Render the Redux-powered flashcard wrapper
  return (
    <div className="container py-6">
      <FlashCardsPageClient slug={slug} userId={user?.id || ""} />
    </div>
  )
}
