"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Bookmark, BookmarkCheck } from "lucide-react"
import type { FlashCard } from "@/app/types/types"

interface FlashCardComponentProps {
  cards: FlashCard[]
  onSaveCard: (card: FlashCard) => void
  savedCardIds: string[]
}

export function FlashCardComponent({ cards, onSaveCard, savedCardIds }: FlashCardComponentProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const currentCard = cards[currentIndex]

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setFlipped(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setFlipped(false)
    }
  }

  const toggleFlip = () => {
    setFlipped(!flipped)
  }

  const isSaved = currentCard?.id ? savedCardIds.includes(currentCard.id) : false

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Card {currentIndex + 1} of {cards.length}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSaveCard(currentCard)}
          aria-label={isSaved ? "Unsave card" : "Save card"}
        >
          {isSaved ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
        </Button>
      </div>

      <Card
        className="w-full min-h-[300px] cursor-pointer transition-all duration-500 perspective-1000"
        onClick={toggleFlip}
      >
        <CardContent className="p-6 h-full flex items-center justify-center">
          <div className={`transition-transform duration-500 ${flipped ? "rotate-y-180" : ""} w-full`}>
            {!flipped ? (
              <div className="text-xl font-medium text-center">{currentCard?.question}</div>
            ) : (
              <div className="text-lg text-center rotate-y-180">{currentCard?.answer}</div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-4">
        <Button onClick={handlePrevious} disabled={currentIndex === 0} variant="outline">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={handleNext} disabled={currentIndex === cards.length - 1}>
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

