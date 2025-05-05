"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { FlashCard } from "@/app/types/types"
import { FlashCardComponent } from "./FlashCardComponent"

import { resetQuiz } from "@/store/slices/quizSlice"
import { useAppDispatch } from "@/store"

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
  const [key, setKey] = useState(Date.now())

  // Check for reset parameter
  useEffect(() => {
    const reset = searchParams.get("reset")
    const timestamp = searchParams.get("t")

    if (reset === "true" && timestamp) {
      dispatch(resetQuiz())

      // Force re-render of the component
      setKey(Date.now())

      // Remove the reset parameter from the URL
      const url = new URL(window.location.href)
      url.searchParams.delete("reset")
      url.searchParams.delete("t")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams, dispatch])

  return (
    <FlashCardComponent
      key={key}
      cards={cards}
      quizId={quizId}
      slug={slug}
      title={title}
      onSaveCard={onSaveCard}
      savedCardIds={savedCardIds}
    />
  )
}
