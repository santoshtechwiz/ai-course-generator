"use server"

import { API_ENDPOINTS } from "@/store/slices/quizSlice"
import type { QuizType } from "@/app/types/quiz-types"
import { apiClient } from "@/lib/api-client"

/**
 * Gets quiz data from the appropriate API based on quiz type
 * This function acts as a compatibility layer for the new API structure
 */
export async function getQuizFromApi(slug: string, type: QuizType = "mcq") {
  try {
    // Get the appropriate endpoint based on quiz type
    const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000";
    const endpoint = API_ENDPOINTS[type]

    // Always append the slug ONCE
    const url = `${baseUrl}${endpoint}/${slug}`

    // Use the apiClient instead of direct fetch
    return await apiClient.get(url);
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
    const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "";
    const baseEndpoint = API_ENDPOINTS[type] || `/api/quizzes/common`
    const endpoint = `${baseEndpoint}/random`

    // Use the apiClient instead of direct fetch
    return await apiClient.get(`${baseUrl}${endpoint}`);
  } catch (error) {
    console.error(`Error fetching random ${type} quiz:`, error)
    throw error
  }
}
