/**
 * Enhanced Flashcard Component with 3D Flip Animation
 * 
 * Features:
 * - 3D flip animation using framer-motion
 * - Keyboard shortcuts (Space, Arrows, Numbers)
 * - Swipe gestures for mobile
 * - Smooth card stack effect
 * - Spaced repetition integration ready
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Star,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Keyboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export interface FlashcardData {
  id: string
  front: string
  back: string
  difficulty?: 'easy' | 'medium' | 'hard'
  tags?: string[]
  lastReviewed?: Date
  nextReview?: Date
  easeFactor?: number
  interval?: number
  repetitions?: number
}

interface EnhancedFlashcardProps {
  cards: FlashcardData[]
  onComplete?: () => void
  onRateCard?: (cardId: string, rating: number) => void
  showProgress?: boolean
  enableKeyboard?: boolean
  enableSwipe?: boolean
  className?: string
}

const SWIPE_THRESHOLD = 100
const SWIPE_POWER_THRESHOLD = 50000

// Difficulty ratings (for spaced repetition) - using primary color theme
const DIFFICULTY_RATINGS = [
  { value: 1, label: 'Again', icon: ThumbsDown, color: 'text-destructive', description: 'Complete blackout' },
  { value: 2, label: 'Hard', icon: Star, color: 'text-warning', description: 'Incorrect, but remembered' },
  { value: 3, label: 'Good', icon: ThumbsUp, color: 'text-primary', description: 'Correct with effort' },
  { value: 4, label: 'Easy', icon: Zap, color: 'text-success', description: 'Perfect recall' },
]

export default function EnhancedFlashcard({
  cards,
  onComplete,
  onRateCard,
  showProgress = true,
  enableKeyboard = true,
  enableSwipe = true,
  className,
}: EnhancedFlashcardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showKeyboardHints, setShowKeyboardHints] = useState(false)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)

  const currentCard = cards[currentIndex]
  const isLastCard = currentIndex === cards.length - 1
  const progress = ((currentIndex + 1) / cards.length) * 100

  // Flip card animation
  const flipCard = useCallback(() => {
    setIsFlipped((prev) => !prev)
  }, [])

  // Navigate to next card
  const nextCard = useCallback(
    (rating?: number) => {
      if (rating && onRateCard && currentCard) {
        onRateCard(currentCard.id, rating)
      }

      if (isLastCard) {
        toast.success('🎉 Deck complete! Great work!')
        onComplete?.()
      } else {
        setDirection('right')
        setIsFlipped(false)
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1)
          setDirection(null)
        }, 300)
      }
    },
    [currentCard, isLastCard, onRateCard, onComplete]
  )

  // Navigate to previous card
  const previousCard = useCallback(() => {
    if (currentIndex > 0) {
      setDirection('left')
      setIsFlipped(false)
      setTimeout(() => {
        setCurrentIndex((prev) => prev - 1)
        setDirection(null)
      }, 300)
    }
  }, [currentIndex])

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboard) return

    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return
      }

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault()
          flipCard()
          break
        case 'ArrowLeft':
          e.preventDefault()
          previousCard()
          break
        case 'ArrowRight':
          e.preventDefault()
          if (isFlipped) nextCard()
          else flipCard()
          break
        case '1':
        case '2':
        case '3':
        case '4':
          e.preventDefault()
          if (isFlipped) nextCard(parseInt(e.key))
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHints((prev) => !prev)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [enableKeyboard, isFlipped, flipCard, nextCard, previousCard])

  // Swipe detection
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!enableSwipe || !isFlipped) return

      const swipePower = Math.abs(info.velocity.x) * info.offset.x

      if (swipePower < -SWIPE_POWER_THRESHOLD) {
        // Swiped left - mark as hard
        nextCard(2)
      } else if (swipePower > SWIPE_POWER_THRESHOLD) {
        // Swiped right - mark as easy
        nextCard(4)
      }
    },
    [enableSwipe, isFlipped, nextCard]
  )

  if (!currentCard) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No cards available</p>
      </div>
    )
  }

  return (
    <div className={cn('relative w-full max-w-2xl mx-auto', className)}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Card {currentIndex + 1} of {cards.length}
            </span>
            <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Card Stack Effect */}
      <div className="relative" style={{ perspective: '1000px' }}>
        {/* Background cards for stack effect */}
        {currentIndex < cards.length - 1 && (
          <>
            <motion.div
              className="absolute inset-0 opacity-20"
              style={{
                transform: 'translateY(8px) scale(0.98)',
                zIndex: -1,
              }}
            >
              <Card className="h-96 bg-gradient-to-br from-muted to-muted/50" />
            </motion.div>
            <motion.div
              className="absolute inset-0 opacity-10"
              style={{
                transform: 'translateY(16px) scale(0.96)',
                zIndex: -2,
              }}
            >
              <Card className="h-96 bg-gradient-to-br from-muted to-muted/50" />
            </motion.div>
          </>
        )}

        {/* Main Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id}
            drag={enableSwipe && isFlipped ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            initial={{
              opacity: 0,
              x: direction === 'left' ? -300 : direction === 'right' ? 300 : 0,
            }}
            animate={{ opacity: 1, x: 0 }}
            exit={{
              opacity: 0,
              x: direction === 'left' ? 300 : direction === 'right' ? -300 : 0,
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              transformStyle: 'preserve-3d',
              cursor: enableSwipe && isFlipped ? 'grab' : 'pointer',
            }}
            onClick={() => !isFlipped && flipCard()}
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 120 }}
              style={{
                transformStyle: 'preserve-3d',
              }}
              className="relative"
            >
              {/* Front of Card */}
              <Card
                className={cn(
                  'h-96 cursor-pointer hover:shadow-lg transition-shadow',
                  'backface-hidden'
                )}
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4">
                    <Badge variant="outline" className="text-xs">
                      Question
                    </Badge>
                  </div>
                  <p className="text-2xl font-medium leading-relaxed">{currentCard.front}</p>
                  <p className="mt-6 text-sm text-muted-foreground">
                    Click or press Space to flip
                  </p>
                </CardContent>
              </Card>

              {/* Back of Card */}
              <Card
                className={cn(
                  'h-96 absolute top-0 left-0 w-full',
                  'backface-hidden bg-primary/5'
                )}
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <CardContent className="h-full flex flex-col p-8">
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="mb-4">
                      <Badge className="text-xs">Answer</Badge>
                    </div>
                    <p className="text-xl leading-relaxed">{currentCard.back}</p>
                  </div>

                  {/* Difficulty Tags */}
                  {currentCard.tags && currentCard.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                      {currentCard.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Rating Buttons (shown when flipped) */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {DIFFICULTY_RATINGS.map((rating) => {
              const Icon = rating.icon
              return (
                <Button
                  key={rating.value}
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4 hover:scale-105 transition-transform"
                  onClick={() => nextCard(rating.value)}
                >
                  <Icon className={cn('w-5 h-5', rating.color)} />
                  <div className="text-center">
                    <div className="font-semibold text-sm">{rating.label}</div>
                    <div className="text-xs text-muted-foreground hidden md:block">
                      {rating.description}
                    </div>
                    <div className="text-xs text-muted-foreground md:hidden">Press {rating.value}</div>
                  </div>
                </Button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="lg"
          onClick={previousCard}
          disabled={currentIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <Button variant="outline" size="lg" onClick={flipCard} className="gap-2">
          <RotateCw className="w-5 h-5" />
          Flip
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={() => (isFlipped ? nextCard() : flipCard())}
          className="gap-2"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Keyboard Hints Toggle */}
      {enableKeyboard && (
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowKeyboardHints((prev) => !prev)}
            className="gap-2 text-xs"
          >
            <Keyboard className="w-4 h-4" />
            {showKeyboardHints ? 'Hide' : 'Show'} Keyboard Shortcuts
          </Button>
        </div>
      )}

      {/* Keyboard Hints */}
      <AnimatePresence>
        {showKeyboardHints && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">Keyboard Shortcuts:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      Space
                    </Badge>
                    <span className="text-muted-foreground">Flip card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      ← →
                    </Badge>
                    <span className="text-muted-foreground">Navigate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      1-4
                    </Badge>
                    <span className="text-muted-foreground">Rate difficulty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      ?
                    </Badge>
                    <span className="text-muted-foreground">Toggle help</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
