"use client"

import { useState, useCallback } from 'react'
import { useAuth } from './use-auth'

export interface FlashcardData {
  id: string
  front: string
  back: string
  courseId?: number
  chapterId?: number
  lastReviewed?: Date
  proficiency: number // 1-5 scale
}

export interface FlashcardHook {
  cards: FlashcardData[]
  isLoading: boolean
  error: string | null
  addCard: (card: Omit<FlashcardData, 'id'>) => Promise<void>
  updateCard: (id: string, updates: Partial<FlashcardData>) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  resetCards: () => Promise<void>
  updateProficiency: (id: string, proficiency: number) => Promise<void>
  getCardsDueForReview: () => FlashcardData[]
}

const useFlashcard = (): FlashcardHook => {
  const { isAuthenticated, userId } = useAuth()
  const [cards, setCards] = useState<FlashcardData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Add a new flashcard
  const addCard = useCallback(async (card: Omit<FlashcardData, 'id'>) => {
    if (!isAuthenticated || !userId) {
      setError('You must be logged in to add flashcards')
      return
    }
    
    setIsLoading(true)
    try {
      // API call to save card
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...card, userId }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to add flashcard')
      }
      
      const newCard = await response.json()
      setCards(prev => [...prev, newCard])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error adding flashcard')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, userId])
  
  // Update an existing flashcard
  const updateCard = useCallback(async (id: string, updates: Partial<FlashcardData>) => {
    setIsLoading(true)
    try {
      // API call to update card
      const response = await fetch(`/api/flashcards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update flashcard')
      }
      
      setCards(prev => prev.map(card => 
        card.id === id ? { ...card, ...updates } : card
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error updating flashcard')
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  // Delete a flashcard
  const deleteCard = useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      // API call to delete card
      const response = await fetch(`/api/flashcards/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete flashcard')
      }
      
      setCards(prev => prev.filter(card => card.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error deleting flashcard')
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  // Reset all flashcards for the user
  const resetCards = useCallback(async () => {
    if (!isAuthenticated || !userId) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/flashcards/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to reset flashcards')
      }
      
      setCards([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error resetting flashcards')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, userId])
  
  // Update card proficiency level
  const updateProficiency = useCallback(async (id: string, proficiency: number) => {
    await updateCard(id, { 
      proficiency, 
      lastReviewed: new Date() 
    })
  }, [updateCard])
  
  // Get cards that are due for review (basic spaced repetition algorithm)
  const getCardsDueForReview = useCallback(() => {
    const now = new Date()
    
    return cards.filter(card => {
      if (!card.lastReviewed) return true
      
      const daysSinceReview = Math.floor(
        (now.getTime() - new Date(card.lastReviewed).getTime()) / 
        (1000 * 60 * 60 * 24)
      )
      
      // Simple algorithm: review cards based on proficiency level
      // Low proficiency = review more often
      const reviewInterval = Math.pow(2, card.proficiency - 1)
      return daysSinceReview >= reviewInterval
    })
  }, [cards])
  
  return {
    cards,
    isLoading,
    error,
    addCard,
    updateCard,
    deleteCard,
    resetCards,
    updateProficiency,
    getCardsDueForReview
  }
}

export default useFlashcard
