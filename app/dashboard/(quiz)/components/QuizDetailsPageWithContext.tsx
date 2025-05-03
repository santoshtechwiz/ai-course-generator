"use client"

import type React from "react"
import QuizDetailsPage from "./QuizDetailsPage"
import type { QuizType } from "@/app/types/quiz-types"
import { useQuizState } from "@/hooks/useQuizState"
import { useEffect, useRef } from "react"

interface QuizDetailsPageWithContextProps {
  title: string
  description: string
  slug: string
  quizType: QuizType
  questionCount: number
  estimatedTime: string
  difficulty?: "easy" | "medium" | "hard"
  authorId?: string
  quizId?: string
  isFavorite?: boolean
  isPublic?: boolean
  children: React.ReactNode
  breadcrumbItems?: { name: string; href: string }[]
  category?: string
  tags?: string[]
  completionRate?: number
}

export default function QuizDetailsPageWithContext({
  title,
  description,
  slug,
  quizType,
  questionCount,
  estimatedTime,
  difficulty = "medium",
  authorId,
  quizId,
  isFavorite = false,
  isPublic = true,
  children,
  breadcrumbItems = [],
  category,
  tags = [],
  completionRate,
}: QuizDetailsPageWithContextProps) {
  // Use the quiz state hook directly
  const { initializeQuiz } = useQuizState()

  // Use a ref to track initialization
  const initialized = useRef(false)

  // Initialize quiz data when component mounts
  useEffect(() => {
    // Only initialize once
    if (initialized.current) return
    initialized.current = true

    if (initializeQuiz) {
      initializeQuiz({
        quizId: quizId || "",
        title,
        description,
        quizType,
        questions: [],
        questionCount,
        estimatedTime,
        difficulty,
        authorId,
        isFavorite,
        isPublic,
        category,
        tags,
        slug,
      })
    }
  }, [
    initializeQuiz,
    quizId,
    title,
    description,
    quizType,
    questionCount,
    estimatedTime,
    difficulty,
    authorId,
    isFavorite,
    isPublic,
    category,
    tags,
    slug,
  ])

  return (
    <QuizDetailsPage
      title={title}
      description={description}
      slug={slug}
      quizType={quizType}
      questionCount={questionCount}
      estimatedTime={estimatedTime}
      difficulty={difficulty}
      authorId={authorId}
      quizId={quizId}
      isFavorite={isFavorite}
      isPublic={isPublic}
      breadcrumbItems={breadcrumbItems}
      category={category}
      tags={tags}
      completionRate={completionRate}
    >
      {children}
    </QuizDetailsPage>
  )
}
