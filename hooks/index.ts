// Main hooks export file - organized by functionality

// UI/UX Hooks
export * from "./use-media-query"
export * from "./use-responsive"
export * from "./use-debounce"
export * from "./use-interval"

export * from "./use-toast"
export * from "./use-similarity"

// Data Persistence Hooks
export * from "./use-persistent-state"

// Auth & User Hooks
export * from "./use-auth"; // Ensure the file exists at this path
export * from "./use-subscription"
// export * from "./use-session-service"; // File not found, commented out to avoid errors
export * from "./use-notifications"
export * from "./use-user-dashboard"

// Course & Quiz Hooks
export * from "./use-chapter-summary" 
export * from "./useCourseActions"; // Ensure the file exists at this path
export * from "./useProgress"; // Ensure the file exists at this path
export * from "./useVideoProgress"; // Ensure the file exists at this path
export * from "./useRandomQuizzes"; // Ensure the file exists at this path

// Export useAuth for centralized authentication access
export { useAuth } from "@/context/auth-context";
