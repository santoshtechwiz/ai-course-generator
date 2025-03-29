"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowLeftRight } from "lucide-react"

interface FlashcardProps {
  front: string
  back: string
  className?: string
  onNext?: () => void
  onPrevious?: () => void
  showNavigation?: boolean
}

export const Flashcard = ({ front, back, className, onNext, onPrevious, showNavigation = true }: FlashcardProps) => {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div className={cn("w-full max-w-xl mx-auto", className)}>
      <div
        className={cn("relative w-full aspect-[3/2] perspective-1000 cursor-pointer", className)}
        onClick={handleFlip}
      >
        <div
          className={cn(
            "absolute w-full h-full transition-all duration-500 transform-style-3d",
            isFlipped ? "rotate-y-180" : "",
          )}
        >
          {/* Front of card */}
          <div
            className={cn(
              "absolute w-full h-full backface-hidden bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center",
              !isFlipped ? "z-10" : "z-0",
            )}
          >
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 dark:text-white">{front}</p>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">Click to flip</div>
            </div>
          </div>

          {/* Back of card */}
          <div
            className={cn(
              "absolute w-full h-full backface-hidden bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center rotate-y-180",
              isFlipped ? "z-10" : "z-0",
            )}
          >
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 dark:text-white">{back}</p>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">Click to flip back</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <Button variant="outline" size="sm" onClick={handleFlip} className="flex items-center gap-2">
          <ArrowLeftRight size={16} />
          <span>Flip Card</span>
        </Button>
      </div>

      {showNavigation && (onPrevious || onNext) && (
        <div className="mt-4 flex items-center justify-between">
          {onPrevious ? (
            <Button variant="outline" size="sm" onClick={onPrevious}>
              Previous
            </Button>
          ) : (
            <div></div>
          )}

          {onNext && (
            <Button variant="outline" size="sm" onClick={onNext}>
              Next
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

