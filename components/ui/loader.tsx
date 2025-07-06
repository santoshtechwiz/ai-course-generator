// Re-export from the new global loader system
export { GlobalLoader } from "../GlobalLoader"
export { useGlobalLoader } from "@/store/global-loader"

// Legacy compatibility exports for specialized loaders
export { LoadingSkeleton, LoadingCard } from "./SkeletonLoader"
export { QuizLoader } from "./quiz-loader"

// Simple, standalone loader component for local use
import { ClipLoader } from "react-spinners"

/**
 * CourseAILoader - Simple standalone loader component
 * Use this for local loading states that don't need global coordination
 * For app-wide loading, use the GlobalLoader system
 */
export default function CourseAILoader({ 
  isLoading = true, 
  message = "Loading...", 
  subMessage,
  className = "",
  size = 40
}: {
  isLoading?: boolean
  message?: string
  subMessage?: string
  className?: string
  size?: number
}) {
  if (!isLoading) return null
  
  return (
    <div className={`flex flex-col items-center justify-center py-8 space-y-4 ${className}`}>
      <ClipLoader color="#3B82F6" size={size} />
      <p className="text-sm font-medium text-foreground">{message}</p>
      {subMessage && <p className="text-xs text-muted-foreground">{subMessage}</p>}
    </div>
  )
}
