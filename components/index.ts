// Re-export all component categories
export * from "./ui"
export * from "./layout"
export * from "./common"
export * from "./features/chat"
export * from "./features/courses"
export * from "./features/quizzes"
export * from "./features/dashboard"
export * from "./features/subscription"
export * from "./forms"
export * from "./animations"

// Centralized Loader System
export {
  Loader,
  FullPageLoader,
  InlineLoader,
  ButtonLoader,
  CardLoader,
  SkeletonLoader,
  LoadingSpinner,
  LoadingSkeleton,
  BounceLoader,
  QuizLoader,
  UnifiedLoader,
} from "./ui/loader"

export { useLoader, LoaderProvider } from "./ui/loader-context"
export { AsyncNavLink } from "./ui/async-nav-link"
