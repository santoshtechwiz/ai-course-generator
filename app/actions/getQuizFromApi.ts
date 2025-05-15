"use server"

import { API_ENDPOINTS } from "@/store/slices/quizSlice"
import type { QuizType } from "@/app/types/quiz-types"

/**
 * Gets quiz data from the appropriate API based on quiz type
 * This function acts as a compatibility layer for the new API structure
 */
export async function getQuizFromApi(slug: string, type: QuizType = "mcq") {
  try {
    // Get the appropriate endpoint based on quiz type
    const endpoint = `${API_ENDPOINTS[type]}/${slug}`

    // Fetch quiz data from the API
    const response = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL || ""}${endpoint}/${slug}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to fetch ${type} quiz`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching ${type} quiz with slug ${slug}:`, error)
    throw error
  }
}

/**
 * Gets random quiz data
 */
export async function getRandomQuiz(type: QuizType = "mcq") {
  try {
    // Get the appropriate endpoint based on quiz type
    const baseEndpoint = API_ENDPOINTS[type] || `/api/quizzes/common`
    const endpoint = `${baseEndpoint}/random`

    // Fetch random quiz data from the API
    const response = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL || ""}${endpoint}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to fetch random ${type} quiz`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching random ${type} quiz:`, error)
    throw error
  }
}
