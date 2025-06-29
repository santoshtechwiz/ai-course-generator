"use client"

import { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/lib/api-client"

export interface RandomQuiz {
  id: string;
  slug: string;
  title: string;
  quizType: string;
  difficulty: string;
  duration?: number;
  bestScore?: number;
  completionRate?: number;
  description?: string;
  popularity?: string;
  createdAt?: string;
}

export function useRandomQuizzes(count: number = 5) {
  const [quizzes, setQuizzes] = useState<RandomQuiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch quizzes function
  const fetchQuizzes = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Use the API client to fetch quizzes
      const response = await apiClient.get("/api/quizzes/common/random", {
        params: { count }
      })
      
      console.log("API response:", response); // Debug the response structure
      
      // Properly handle the response data - check if it's an array or nested in a property
      let quizzesData = Array.isArray(response) ? response : 
                       Array.isArray(response.quizzes) ? response.quizzes : 
                       response.data?.quizzes || response.data || [];
      
      // Process the quizzes with default values if needed
      const processedQuizzes = quizzesData.map((quiz: any) => ({
        id: quiz.id || `quiz-${Math.random().toString(36).substring(2, 9)}`,
        slug: quiz.slug || quiz.id || `quiz-${Math.random().toString(36).substring(2, 9)}`,
        title: quiz.title || "Untitled Quiz",
        quizType: quiz.quizType || "mcq",
        difficulty: quiz.difficulty || "Medium",
        duration: quiz.duration || 5,
        completionRate: quiz.completionRate ?? 70,
        description: quiz.description || "Practice your skills with this interactive quiz.",
        popularity: quiz.popularity || "Medium",
      }));

      console.log("Processed quizzes:", processedQuizzes); // Debug processed data
      
      if (processedQuizzes.length === 0) {
        console.log("No quizzes returned from API, using fallbacks");
        setQuizzes(generateFallbackQuizzes(count));
      } else {
        setQuizzes(processedQuizzes);
      }
    } catch (err) {
      console.error("Failed to fetch random quizzes", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch quizzes"))
      
      // Use fallback data in case of error
      const fallbackQuizzes = generateFallbackQuizzes(count)
      setQuizzes(fallbackQuizzes)
    } finally {
      setIsLoading(false)
    }
  }, [count])

  // Fetch quizzes on mount
  useEffect(() => {
    fetchQuizzes()
  }, [fetchQuizzes])

  // Generate fallback quizzes for testing or when API fails
  const generateFallbackQuizzes = (count: number): RandomQuiz[] => {
    const types = ["mcq", "blanks", "code", "flashcard", "openended"]
    const difficulties = ["Easy", "Medium", "Hard"]
    const topics = ["JavaScript Basics", "React Hooks", "CSS Grid Layout", "Python Functions", "TypeScript Interfaces"]
    
    // Use deterministic values instead of random for hydration safety
    return Array.from({ length: count }).map((_, index) => {
      const typeIndex = index % types.length;
      const difficultyIndex = Math.floor(index / 2) % difficulties.length;
      const topicIndex = index % topics.length;
      
      const type = types[typeIndex];
      const difficulty = difficulties[difficultyIndex];
      const topic = topics[topicIndex];
      const id = `fallback-${type}-${index}`;
      
      return {
        id,
        slug: id,
        title: `${topic} Quiz`,
        quizType: type,
        difficulty,
        duration: 5 + (index % 5), // Deterministic duration
        bestScore: 60 + (index * 3) % 40, // Deterministic score
        completionRate: 50 + (index * 5) % 50, // Deterministic completion rate
        description: `Test your knowledge on ${topic} with this interactive ${type} quiz.`,
        popularity: index % 2 === 0 ? "High" : "Medium", // Deterministic popularity
      }
    })
  }

  return {
    quizzes,
    isLoading,
    error,
    refresh: fetchQuizzes
  }
}
