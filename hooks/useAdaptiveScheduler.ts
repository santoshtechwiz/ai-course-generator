"use client"

import { useCallback } from 'react'
import { useAppSelector } from '@/store'

interface FlashCard {
  id: string
  question: string
  answer: string
  difficulty?: "easy" | "medium" | "hard"
}

interface SchedulerOptions {
  cards: FlashCard[]
  currentQuestionIndex: number
}

export function useAdaptiveScheduler({ cards, currentQuestionIndex }: SchedulerOptions) {
  const answers = useAppSelector((state) => state.flashcard.answers)

  const computeNextIndex = useCallback(() => {
    if (!cards?.length) return currentQuestionIndex

    // Build answer history map
    const statusById = new Map<string, "correct" | "incorrect" | "still_learning" | "unseen">()

    answers.forEach((answer: any) => {
      if (answer && typeof answer.questionId !== 'undefined' && typeof answer.answer !== 'undefined') {
        statusById.set(String(answer.questionId), answer.answer)
      }
    })

    // Categorize cards by difficulty and performance
    const categories = {
      highPriority: [] as number[], // Incorrect answers
      mediumPriority: [] as number[], // Still learning
      lowPriority: [] as number[], // Correct but need review
      newCards: [] as number[] // Unseen cards
    }

    cards.forEach((card, idx) => {
      const status = statusById.get(String(card.id)) || "unseen"
      const difficulty = card.difficulty || "medium"

      if (status === "incorrect") {
        categories.highPriority.push(idx)
      } else if (status === "still_learning") {
        categories.mediumPriority.push(idx)
      } else if (status === "correct") {
        // Review correct cards less frequently based on difficulty
        const reviewProbability = difficulty === "hard" ? 0.3 : difficulty === "medium" ? 0.2 : 0.1
        if (Math.random() < reviewProbability) {
          categories.lowPriority.push(idx)
        }
      } else {
        categories.newCards.push(idx)
      }
    })

    // Remove current index to avoid immediate repeats
    const removeCurrent = (arr: number[]) => arr.filter((i) => i !== currentQuestionIndex)

    const pools = [
      { items: removeCurrent(categories.highPriority), weight: 0.5 },
      { items: removeCurrent(categories.mediumPriority), weight: 0.3 },
      { items: removeCurrent(categories.newCards), weight: 0.15 },
      { items: removeCurrent(categories.lowPriority), weight: 0.05 }
    ]

    // Weighted random selection
    const random = Math.random()
    let cumulativeWeight = 0

    for (const pool of pools) {
      cumulativeWeight += pool.weight
      if (random <= cumulativeWeight && pool.items.length > 0) {
        return pool.items[Math.floor(Math.random() * pool.items.length)]
      }
    }

    // Fallback: sequential progression
    const next = currentQuestionIndex + 1
    return next < cards.length ? next : 0
  }, [cards, currentQuestionIndex, answers])

  return { computeNextIndex }
}