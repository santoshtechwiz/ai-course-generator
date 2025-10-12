"use client"

import { useState } from "react"
import EnhancedFlashcard from "@/components/flashcard/EnhancedFlashcard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

// Demo flashcard data
const demoFlashcards = [
  {
    id: "1",
    front: "What is React?",
    back: "React is a JavaScript library for building user interfaces, particularly single-page applications. It was developed by Facebook and allows developers to create reusable UI components.",
    deckId: "demo",
    lastReviewed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    nextReview: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Due yesterday
    interval: 7,
    easeFactor: 2.5,
    repetitions: 2,
  },
  {
    id: "2",
    front: "What are React Hooks?",
    back: "React Hooks are functions that let you use state and other React features in functional components. Common hooks include useState, useEffect, useContext, and useCallback.",
    deckId: "demo",
    lastReviewed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    nextReview: new Date(),
    interval: 3,
    easeFactor: 2.3,
    repetitions: 1,
  },
  {
    id: "3",
    front: "What is the Virtual DOM?",
    back: "The Virtual DOM is a lightweight copy of the actual DOM. React uses it to improve performance by calculating the minimal set of changes needed and updating only those parts in the real DOM.",
    deckId: "demo",
    lastReviewed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    nextReview: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    interval: 1,
    easeFactor: 2.1,
    repetitions: 0,
  },
  {
    id: "4",
    front: "What is JSX?",
    back: "JSX (JavaScript XML) is a syntax extension for JavaScript that allows you to write HTML-like code in your JavaScript files. It makes React code more readable and is transformed into regular JavaScript by transpilers like Babel.",
    deckId: "demo",
    lastReviewed: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    nextReview: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    interval: 14,
    easeFactor: 2.8,
    repetitions: 3,
  },
  {
    id: "5",
    front: "What is the difference between props and state?",
    back: "Props are read-only data passed from parent to child components, while state is mutable data managed within a component. Props are used for component configuration, state is used for data that changes over time.",
    deckId: "demo",
    lastReviewed: undefined,
    nextReview: new Date(),
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
  },
]

export default function FlashcardDemoPage() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reviewedCards, setReviewedCards] = useState<string[]>([])

  const currentCard = demoFlashcards[currentIndex]
  const progress = ((reviewedCards.length / demoFlashcards.length) * 100).toFixed(0)

  const handleRate = async (cardId: string, quality: number) => {
    console.log(`Rated card ${cardId} with quality: ${quality}`)
    
    // Mark as reviewed
    if (!reviewedCards.includes(cardId)) {
      setReviewedCards([...reviewedCards, cardId])
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < demoFlashcards.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const resetSession = () => {
    setCurrentIndex(0)
    setReviewedCards([])
  }

  // Check if all cards are reviewed
  const isComplete = reviewedCards.length === demoFlashcards.length

  if (isComplete) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>🎉 Study Session Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Great job! You&apos;ve reviewed all {demoFlashcards.length} flashcards in this demo deck.
            </p>
            <div className="flex gap-4">
              <Button onClick={resetSession}>
                Study Again
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <div className="text-sm text-muted-foreground">
          Progress: {progress}% ({reviewedCards.length}/{demoFlashcards.length})
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>📚 React Fundamentals - Demo Deck</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This is a demo of the enhanced flashcard system with 3D animations, keyboard shortcuts, and spaced repetition.
            Try using keyboard shortcuts: <kbd>Space</kbd> to flip, <kbd>←→</kbd> to navigate, <kbd>1-4</kbd> to rate, <kbd>?</kbd> for help.
          </p>
        </CardContent>
      </Card>

      <EnhancedFlashcard
        cards={demoFlashcards}
        onComplete={() => {
          console.log("All cards reviewed!")
          setReviewedCards(demoFlashcards.map(c => c.id))
        }}
        onRateCard={handleRate}
        showProgress
        enableKeyboard
        enableSwipe
      />

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          💡 Tip: The spaced repetition algorithm will schedule your next review based on how well you know each card.
        </p>
      </div>
    </div>
  )
}
