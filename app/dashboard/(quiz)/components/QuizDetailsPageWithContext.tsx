"use client"

import { QuizProvider } from "@/app/context/QuizContext"
import type React from "react"
import QuizDetailsPage from "./QuizDetailsPage"

interface QuizDetailsPageWithContextProps {
  title: string
  description: string
  slug: string
  quizType: "mcq" | "openended" | "fill-blanks" | "code" | "flashcard"
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
  return (
    <QuizProvider
      quizId={quizId || ""}
      slug={slug}
      title={title}
      description={description}
      quizType={quizType}
      questionCount={questionCount}
      estimatedTime={estimatedTime}
      breadcrumbItems={breadcrumbItems}
    >
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
    </QuizProvider>
  )
}
