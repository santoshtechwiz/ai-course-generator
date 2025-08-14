import { nanoid } from "nanoid"
import slugify from "slugify"
import clsx, { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { migratedStorage } from "@/lib/storage"
import { fetchWithTimeout } from "@/lib/http"

// Define a local QuizType for this file
type QuizType = 'blanks' | 'openended' | 'mcq' | 'code' | 'flashcard';


export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const buildQuizUrl = (slug: string, type: QuizType) => {
  return `/dashboard/(quiz)/${type}/quizzes/${slug}`
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

/**
 * Format seconds into minutes:seconds format
 * @param seconds - Number of seconds to format
 * @returns Formatted time string (e.g., "5:23")
 */
export function formatDuration(seconds: number): string {
  if (!seconds) return "--:--";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function saveToken(token: string) {
  migratedStorage.setItem("authToken", token, { secure: true })
}

export function getToken() {
  return migratedStorage.getItem<string>("authToken", { secure: true })
}

export const fetchSubscriptionStatus = async (timeout = 15000) => {
  const res = await fetchWithTimeout("/api/subscriptions/status", {
    method: "GET",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Expires: "0",
    },
  }, timeout)
  if (res.status === 401) return { isFree: true }
  if (!res.ok) throw new Error(await res.text())
  return await res.json()
}

export const getAIModel = (userType: string): string => {
  switch (userType) {
    case "FREE":
    case "BASIC":
      return "gpt-3.5-turbo-1106"
    case "PREMIUM":
    case "ULTIMATE":
      return "gpt-4-1106-preview"
    default:
      return "gpt-3.5-turbo-1106"
  }
}

/**
 * Get the AI model to use based on user type
 * 
 * @param userType The user type (FREE, BASIC, PREMIUM, ULTIMATE)
 * @returns The AI model to use
 */
export const getAIModelFromConfig = (userType: string): string => {
  // Import this way to avoid circular dependencies
  const { getAIProviderConfig } = require('./ai/config');
  const config = getAIProviderConfig();
  
  // Return the model for the user type, or default to FREE
  return config.models[userType] || config.models.FREE;
}