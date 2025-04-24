import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

import { nanoid } from "nanoid"
import slugify from "slugify"
import type { QuizType } from "@/app/types/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }

  const parsedDate = date instanceof Date ? date : new Date(date)
  return new Intl.DateTimeFormat("en-US", options).format(parsedDate)
}

export function getBaseUrl() {
  if (typeof window !== "undefined") return "" // browser should use relative url
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL // SSR should use NEXTAUTH_URL
  return `http://localhost:${process.env.PORT ?? 3000}` // dev SSR should use localhost
}

export function formatTimeDelta(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds - hours * 3600) / 60)
  const secs = Math.floor(seconds - hours * 3600 - minutes * 60)
  const parts = []
  if (hours > 0) {
    parts.push(`${hours}h`)
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`)
  }
  if (secs > 0) {
    parts.push(`${secs}s`)
  }
  return parts.join(" ")
}

export const formatTime = (time: any): string => {
  time = Math.round(time)

  const minutes: number | string = Math.floor(time / 60)
  let seconds: number | string = time - minutes * 60

  seconds = seconds < 10 ? "0" + seconds : seconds

  return `${minutes}:${seconds}`
}

export function generateSlug(text: string): string {
  const baseSlug = slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  })
  const uniqueId = nanoid(6) // Generate a short, unique string
  return `${baseSlug}-${uniqueId}`
}

export function getVideoQualityOptions(availableQualities: string[]): { value: string; label: string }[] {
  const defaultOptions = [
    { value: "auto", label: "Auto" },
    { value: "hd1080", label: "1080p" },
    { value: "hd720", label: "720p" },
    { value: "large", label: "480p" },
    { value: "medium", label: "360p" },
    { value: "small", label: "240p" },
    { value: "tiny", label: "144p" },
  ]

  if (!availableQualities || availableQualities.length === 0) {
    return defaultOptions
  }

  return defaultOptions.filter((option) => option.value === "auto" || availableQualities.includes(option.value))
}

export const PLAYBACK_SPEEDS = [
  { value: 0.25, label: "0.25x" },
  { value: 0.5, label: "0.5x" },
  { value: 0.75, label: "0.75x" },
  { value: 1, label: "1x" },
  { value: 1.25, label: "1.25x" },
  { value: 1.5, label: "1.5x" },
  { value: 1.75, label: "1.75x" },
  { value: 2, label: "2x" },
]

export const extractUserAnswer = (answer: Object): string | string[] => {
  if (typeof answer === "object" && answer !== null) {
    if ("userAnswer" in answer && typeof answer.userAnswer === "string") {
      return answer.userAnswer
    }
    if ("answer" in answer && typeof answer.answer === "string") {
      return answer.answer
    }
  }
  return ""
}

export const buildQuizUrl = (slug: string, type: QuizType) => {
  switch (type) {
    case "mcq":
      return `/dashboard/mcq/${slug}`
    case "fill-blanks":
      return `/dashboard/blanks/${slug}`
    case "openended":
      return `/dashboard/openended/${slug}`
    case "flashcard":
      return `/dashboard/flashcard/${slug}`
    case "code":
      return `/dashboard/code/${slug}`
    default:
      return `/dashboard/course/${slug}`
  }
}

export const formatQuizTime = (time: number): string => {
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  const seconds = time % 60

  return `${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m ` : ""}${seconds}s`
}

export async function markdownToHtml(markdown: string): Promise<string> {
  // Simple implementation - in a real app, you might use a library like marked or remark
  return markdown
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*)\*/gim, "<em>$1</em>")
    .replace(/\n/gim, "<br>")
    .replace(/\[([^\]]+)\]$$([^)]+)$$/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
}
