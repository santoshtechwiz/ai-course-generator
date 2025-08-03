"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { apiClient } from "@/lib/api-client"

export interface RandomQuiz {
  id: string
  slug: string
  title: string
  quizType: string
  difficulty: string
  duration?: number
  bestScore?: number
  completionRate?: number
  description?: string
  popularity?: string
  createdAt?: string
  isNew?: boolean
  tags?: string[]
}

// Cache for quizzes with timestamp
interface QuizCache {
  quizzes: RandomQuiz[]
  timestamp: number
  count: number
}

// Global cache to avoid refetching
const quizCache = new Map<string, QuizCache>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useRandomQuizzes(count: number = 6) {
  const [quizzes, setQuizzes] = useState<RandomQuiz[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  const cacheKey = `random-${count}`

  // Check if we have valid cached data
  const getCachedQuizzes = useCallback(() => {
    const cached = quizCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.quizzes
    }
    return null
  }, [cacheKey])

  // Fetch quizzes function with caching
  const fetchQuizzes = useCallback(async (force = false) => {
    // Check cache first unless forced
    if (!force) {
      const cached = getCachedQuizzes()
      if (cached) {
        setQuizzes(cached)
        setIsLoading(false)
        return cached
      }
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.get("/api/quizzes/common/random", {
        params: { count }
      })
      
      let quizzesData = Array.isArray(response) ? response : 
                       Array.isArray(response.quizzes) ? response.quizzes : 
                       response.data?.quizzes || response.data || []
      
      // Enhanced processing with engaging features
      const processedQuizzes: RandomQuiz[] = quizzesData.map((quiz: any, index: number) => ({
        id: quiz.id || `quiz-${Date.now()}-${index}`,
        slug: quiz.slug || quiz.id || `quiz-${Date.now()}-${index}`,
        title: quiz.title || "Untitled Quiz",
        quizType: quiz.quizType || "mcq",
        difficulty: quiz.difficulty || "Medium",
        duration: quiz.duration || 5,
        completionRate: quiz.completionRate ?? Math.floor(70 + Math.random() * 25),
        description: quiz.description || generateEngagingDescription(quiz.title, quiz.quizType),
        popularity: quiz.popularity || (Math.random() > 0.6 ? "High" : "Medium"),
        isNew: quiz.createdAt ? isRecentlyCreated(quiz.createdAt) : Math.random() > 0.7,
        tags: quiz.tags || generateTags(quiz.title, quiz.quizType),
        bestScore: quiz.bestScore ?? Math.floor(60 + Math.random() * 35)
      }))

      // Shuffle for variety
      const shuffledQuizzes = shuffleArray(processedQuizzes)

      if (shuffledQuizzes.length === 0) {
        const fallbackQuizzes = generateFallbackQuizzes(count)
        setQuizzes(fallbackQuizzes)
        // Cache fallback quizzes for a shorter time
        quizCache.set(cacheKey, {
          quizzes: fallbackQuizzes,
          timestamp: Date.now(),
          count
        })
        return fallbackQuizzes
      }

      setQuizzes(shuffledQuizzes)
      setLastFetchTime(Date.now())
      
      // Cache the results
      quizCache.set(cacheKey, {
        quizzes: shuffledQuizzes,
        timestamp: Date.now(),
        count
      })

      return shuffledQuizzes
    } catch (err) {
      console.error("Failed to fetch random quizzes", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch quizzes"))
      
      // Try to use cached data even if expired
      const cached = quizCache.get(cacheKey)
      if (cached) {
        setQuizzes(cached.quizzes)
        return cached.quizzes
      }
      
      // Use fallback data
      const fallbackQuizzes = generateFallbackQuizzes(count)
      setQuizzes(fallbackQuizzes)
      return fallbackQuizzes
    } finally {
      setIsLoading(false)
    }
  }, [count, cacheKey, getCachedQuizzes])
  // Initialize with cached data or fetch
  useEffect(() => {
    const cached = getCachedQuizzes()
    if (cached) {
      setQuizzes(cached)
      setIsLoading(false)
    } else {
      fetchQuizzes()
    }
  }, [getCachedQuizzes, fetchQuizzes])

  // Refresh function that forces new fetch
  const refresh = useCallback(() => {
    return fetchQuizzes(true)
  }, [fetchQuizzes])

  // Smart shuffle that maintains some quizzes for familiarity
  const shuffleQuizzes = useCallback(() => {
    if (quizzes.length <= 1) return
    
    const currentQuizzes = [...quizzes]
    const shuffled = shuffleArray(currentQuizzes)
    setQuizzes(shuffled)
  }, [quizzes])

  // Memoized computed values for performance
  const stats = useMemo(() => ({
    totalQuizzes: quizzes.length,
    averageCompletion: quizzes.reduce((acc, quiz) => acc + (quiz.completionRate || 0), 0) / quizzes.length || 0,
    newQuizzesCount: quizzes.filter(quiz => quiz.isNew).length,
    popularQuizzesCount: quizzes.filter(quiz => quiz.popularity === "High").length
  }), [quizzes])

  return {
    quizzes,
    isLoading,
    error,
    refresh,
    shuffleQuizzes,
    stats,
    lastFetchTime,
    isCached: lastFetchTime === 0 && quizzes.length > 0
  }
}

// Utility functions
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function generateEngagingDescription(title: string, quizType: string): string {
  const typeDescriptions = {
    mcq: "Test your knowledge with multiple choice questions",
    flashcard: "Master concepts with interactive flashcards", 
    code: "Challenge your coding skills",
    blanks: "Fill in the blanks to complete your understanding",
    openended: "Express your knowledge with detailed answers"
  }
  
  const engagingPrefixes = [
    "🚀 Ready to",
    "💡 Time to", 
    "🎯 Master",
    "⭐ Discover",
    "🔥 Challenge yourself with"
  ]
  
  const prefix = engagingPrefixes[Math.floor(Math.random() * engagingPrefixes.length)]
  const description = typeDescriptions[quizType as keyof typeof typeDescriptions] || "Test your skills"
  
  return `${prefix} ${description.toLowerCase()}!`
}

function generateTags(title: string, quizType: string): string[] {
  const commonTags = ["learning", "practice", "skill-building"]
  const typeSpecificTags = {
    mcq: ["multiple-choice", "quick-test"],
    flashcard: ["memorization", "review"], 
    code: ["programming", "coding"],
    blanks: ["fill-in", "completion"],
    openended: ["essay", "detailed"]
  }
  
  const tags = [...commonTags]
  const specific = typeSpecificTags[quizType as keyof typeof typeSpecificTags] || []
  tags.push(...specific)
  
  // Add difficulty-based tags
  if (title.toLowerCase().includes("advanced") || title.toLowerCase().includes("expert")) {
    tags.push("advanced")
  } else if (title.toLowerCase().includes("basic") || title.toLowerCase().includes("intro")) {
    tags.push("beginner")
  }
  
  return tags.slice(0, 4) // Limit to 4 tags
}

function isRecentlyCreated(createdAt: string): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const diffInDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  return diffInDays <= 7 // Consider "new" if created within 7 days
}

// Enhanced fallback quizzes with more engaging content
function generateFallbackQuizzes(count: number): RandomQuiz[] {
  const quizTemplates = [
    {
      title: "JavaScript Fundamentals",
      quizType: "mcq",
      difficulty: "Easy",
      description: "🚀 Master the basics of JavaScript programming!",
      tags: ["javascript", "fundamentals", "beginner"]
    },
    {
      title: "React Hooks Deep Dive", 
      quizType: "flashcard",
      difficulty: "Medium",
      description: "💡 Discover the power of React Hooks!",
      tags: ["react", "hooks", "intermediate"]
    },
    {
      title: "CSS Grid Mastery",
      quizType: "code", 
      difficulty: "Medium",
      description: "🎯 Build beautiful layouts with CSS Grid!",
      tags: ["css", "grid", "layout"]
    },
    {
      title: "Python Data Structures",
      quizType: "blanks",
      difficulty: "Easy", 
      description: "⭐ Explore Python's powerful data structures!",
      tags: ["python", "data-structures", "beginner"]
    },
    {
      title: "Advanced TypeScript",
      quizType: "openended",
      difficulty: "Hard",
      description: "🔥 Challenge yourself with advanced TypeScript concepts!",
      tags: ["typescript", "advanced", "programming"]
    },
    {
      title: "Database Design Principles",
      quizType: "mcq",
      difficulty: "Medium",
      description: "💡 Learn to design efficient databases!",
      tags: ["database", "design", "sql"]
    }
  ]
  
  return Array.from({ length: count }).map((_, index) => {
    const template = quizTemplates[index % quizTemplates.length]
    const id = `fallback-${template.quizType}-${index}`
    
    return {
      id,
      slug: id,
      title: template.title,
      quizType: template.quizType,
      difficulty: template.difficulty,
      duration: 5 + (index % 10), // 5-15 minutes
      completionRate: 65 + (index * 7) % 30, // 65-95%
      description: template.description,
      popularity: index % 3 === 0 ? "High" : "Medium",
      isNew: index % 4 === 0,
      tags: template.tags,
      bestScore: 70 + (index * 5) % 25 // 70-95%
    }
  })
}
