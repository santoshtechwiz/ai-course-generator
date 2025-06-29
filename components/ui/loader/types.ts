import type React from "react"
export type LoaderSize = "xs" | "sm" | "md" | "lg" | "xl"
export type LoaderVariant = "inline" | "fullscreen" | "card" | "overlay" | "skeleton" | "minimal"
export type LoaderContext =
  | "loading"
  | "quiz"
  | "result"
  | "submitting"
  | "processing"
  | "saving"
  | "course"
  | "generating"

export interface LoaderProps {
  size?: LoaderSize
  variant?: LoaderVariant
  context?: LoaderContext
  className?: string
  message?: string
  subMessage?: string
  showIcon?: boolean
  children?: React.ReactNode
  isLoading?: boolean
  progress?: number
  showProgress?: boolean
  animated?: boolean
}
