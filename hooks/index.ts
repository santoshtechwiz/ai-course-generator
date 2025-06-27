// Main hooks export file - organized by functionality

// UI/UX Hooks
export * from "./use-media-query"
export * from "./use-responsive"
export * from "./use-debounce"
export * from "./use-interval"
export * from "./use-navigation-loader"

export * from "./use-toast"
export * from "./use-similarity"

// Data Persistence Hooks
export * from "./use-persistent-state"

// Auth & User Hooks
// Import useAuth directly from auth-context
export { useAuth } from "@/context/auth-context"
export * from "./use-subscription"
// export * from "./use-session-service"; // File not found, commented out to avoid errors
export * from "./use-notifications"
export * from "./use-user-dashboard"

// Course & Quiz Hooks
export * from "./use-chapter-summary" 
export * from "./useCourseActions"

export * from "../app/dashboard/course/[slug]/components/video/hooks/useVideoProgress"
export * from "./useRandomQuizzes"
