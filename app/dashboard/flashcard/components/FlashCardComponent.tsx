"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle, XCircle, Bookmark, BookmarkCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { FlashCard } from "@/app/types/types"

interface FlashCardComponentProps {
  cards: FlashCard[]
  onSaveCard?: (card: FlashCard) => void
  savedCardIds?: string[]
  onComplete?: () => void
}

export function FlashCardComponent({ cards, onSaveCard, savedCardIds = [], onComplete }: FlashCardComponentProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [direction, setDirection] = useState(0)
  const [progress, setProgress] = useState(0)
  const [score, setScore] = useState({ correct: 0, incorrect: 0 })

  useEffect(() => {
    setProgress(((currentIndex + 1) / cards.length) * 100)
  }, [currentIndex, cards.length])

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setDirection(1)
      setIsFlipped(false)
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1)
      }, 300)
    } else if (onComplete) {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setDirection(-1)
      setIsFlipped(false)
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1)
      }, 300)
    }
  }

  const handleAnswer = (correct: boolean) => {
    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1),
    }))
    handleNext()
  }

  const handleSave = () => {
    if (onSaveCard && cards[currentIndex]) {
      onSaveCard(cards[currentIndex])
    }
  }

  const currentCard = cards[currentIndex]
  const isSaved = currentCard?.id ? savedCardIds.includes(currentCard.id) : false

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-lg font-medium text-primary">
          Card {currentIndex + 1} of {cards.length}
        </div>
        <div className="flex space-x-4 text-sm font-medium">
          <div className="flex items-center text-green-500">
            <CheckCircle className="mr-1 h-4 w-4" />
            {score.correct}
          </div>
          <div className="flex items-center text-red-500">
            <XCircle className="mr-1 h-4 w-4" />
            {score.incorrect}
          </div>
        </div>
      </div>

      <Progress value={progress} className="w-full h-2" />

      <div className="relative w-full h-[400px] perspective-[1200px]">
        <div
          className={cn(
            "relative w-full h-full transform-style-3d transition-transform duration-500",
            isFlipped ? "rotate-y-180" : "",
          )}
        >
          {/* Front of card */}
          <div
            className={cn(
              "absolute inset-0 w-full h-full backface-hidden rounded-xl shadow-lg p-8",
              "bg-gradient-to-br from-card to-card/90 border border-border",
              "flex flex-col justify-between",
            )}
          >
            <div className="flex justify-between items-start">
              <div className="text-2xl font-bold text-primary">Question</div>
              {onSaveCard && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSave}
                  className="text-muted-foreground hover:text-primary"
                >
                  {isSaved ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
                </Button>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center">
              <p className="text-xl text-center">{currentCard?.question}</p>
            </div>

            <Button
              onClick={handleFlip}
              variant="outline"
              className="w-full mt-4 bg-primary/5 hover:bg-primary/10 border-primary/20"
            >
              Reveal Answer
            </Button>
          </div>

          {/* Back of card */}
          <div
            className={cn(
              "absolute inset-0 w-full h-full backface-hidden rounded-xl shadow-lg p-8 rotate-y-180",
              "bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20",
              "flex flex-col justify-between",
            )}
          >
            <div className="flex justify-between items-start">
              <div className="text-2xl font-bold text-primary">Answer</div>
              {onSaveCard && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSave}
                  className="text-muted-foreground hover:text-primary"
                >
                  {isSaved ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
                </Button>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center">
              <p className="text-xl text-center">{currentCard?.answer}</p>
            </div>

            <div className="flex space-x-3 mt-4">
              <Button
                onClick={() => handleAnswer(false)}
                variant="outline"
                className="flex-1 bg-red-100/50 hover:bg-red-200/50 text-red-600 border-red-200"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Incorrect
              </Button>
              <Button
                onClick={() => handleAnswer(true)}
                variant="outline"
                className="flex-1 bg-green-100/50 hover:bg-green-200/50 text-green-600 border-green-200"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Correct
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        <Button onClick={handlePrevious} disabled={currentIndex === 0} variant="outline" className="flex items-center">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={handleFlip} variant="outline" className="flex items-center">
          <RotateCcw className="mr-2 h-4 w-4" />
          Flip
        </Button>
        <Button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1 && !onComplete}
          variant="outline"
          className="flex items-center"
        >
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

