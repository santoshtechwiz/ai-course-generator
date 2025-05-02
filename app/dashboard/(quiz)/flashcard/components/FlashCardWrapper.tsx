"use client"
import { QuizProvider } from "@/app/context/QuizContext"
import type { FlashCard } from "@/app/types/types"
import { FlashCardComponent } from "./FlashCardComponent"

interface FlashCardComponentProps {
  cards: FlashCard[]
  quizId: string | number
  slug: string
  title: string
  onSaveCard?: (card: FlashCard) => void
  savedCardIds?: string[]
}

export function FlashCardWrapper({
  cards,
  quizId,
  slug,
  title,
  onSaveCard,
  savedCardIds = [],
}: FlashCardComponentProps) {
  return (
    <QuizProvider
      quizData={{ questions: cards, id: String(quizId), title, quizType: "flashcard" }}
      slug={slug}
      quizType="flashcard"
    >
      <FlashCardComponent
        cards={cards}
        quizId={quizId}
        slug={slug}
        title={title}
        onSaveCard={onSaveCard}
        savedCardIds={savedCardIds}
      />
    </QuizProvider>
  )
}
