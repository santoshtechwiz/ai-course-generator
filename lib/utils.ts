import { nanoid } from "nanoid"
import slugify from "slugify"
import type { QuizType } from "@/app/types/types"
import clsx, { ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


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
  localStorage.setItem("authToken", token)
}

export function getToken() {
  return localStorage.getItem("authToken")
}

export const fetchSubscriptionStatus = async (timeout = 15000) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch("/api/subscriptions/status", {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Expires: "0",
      },
      signal: controller.signal,
    })
    if (res.status === 401) return { isFree: true }
    if (!res.ok) throw new Error(await res.text())
    return await res.json()
  } finally {
    clearTimeout(id)
  }
}

export const getAIModel = (userType: string): string => {
  switch (userType) {
    case "FREE":
    case "BASIC":
      return "gpt-3.5-turbo-1106"
    case "PRO":
    case "ULTIMATE":
      return "gpt-4-1106-preview"
    default:
      return "gpt-3.5-turbo-1106"
  }
}