"use client"
import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import type { FlashCard } from "@/app/types/types"
import { FlashCardComponent } from "./FlashCardComponent"
import { useAppDispatch } from "@/store"
import { resetFlashCards } from "@/store/slices/flashcard-slice"


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
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const [key, setKey] = useState<number>(() => Date.now())

  // Optimize effect to only run when reset param changes
  useEffect(() => {
    const reset = searchParams.get("reset")
    const timestamp = searchParams.get("t")

    if (reset === "true" && timestamp) {
      dispatch(resetFlashCards())
      
      // Force re-render with debounce to prevent multiple renders
      const timerId = setTimeout(() => {
        setKey(Date.now())
      }, 10)

      // Clear timer on unmount
      return () => clearTimeout(timerId)
    }
  }, [searchParams, dispatch])

  // Memoize onSaveCard to prevent rerenders
  const handleSaveCard = useCallback((card: FlashCard) => {
    if (onSaveCard) onSaveCard(card)
  }, [onSaveCard])

  return (
    <FlashCardComponent
      key={key}
      cards={cards}
      quizId={quizId}
      slug={slug}
      title={title}
      onSaveCard={handleSaveCard}
      savedCardIds={savedCardIds}
    />
  )
}
