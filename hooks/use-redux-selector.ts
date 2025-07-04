import { useSelector } from "react-redux"
import type { TypedUseSelectorHook } from "react-redux"
import type { RootState } from "@/store"
import { createSelector } from "@reduxjs/toolkit"
import { useAuth } from "./use-auth"

/**
 * @deprecated Use useAppSelector from @/store instead
 */
export const useReduxSelector: TypedUseSelectorHook<RootState> = useSelector

/**
 * Create a hook that selects a specific piece of state with memoization
 * @param selector Function that selects a piece of state
 * @param equalityFn Optional equality function
 * @returns Selected state
 */
export function useMemoSelector<TSelected>(
  selector: (state: RootState) => TSelected,
  equalityFn?: (left: TSelected, right: TSelected) => boolean,
) {
  // Use createSelector from Redux Toolkit for proper memoization
  const memoizedSelector = createSelector([(state: RootState) => state], (state) => selector(state))

  return useSelector(memoizedSelector)
}

/**
 * Hook to get authentication state
 * @returns Authentication state
 * @deprecated Use useAuth from @/hooks/useAuth instead
 */
export function useAuthState() {
  // Return Redux auth state but log a deprecation warning
  console.warn("useAuthState is deprecated. Use useAuth from @/hooks/useAuth instead for a consolidated auth solution.")
  return useSelector((state: RootState) => state.auth)
}

/**
 * Hook to get user state
 * @returns User state
 */
export function useUserState() {
  return useSelector((state: RootState) => state.user)
}

/**
 * Hook to get quiz state
 * @returns Quiz state
 */
export function useQuizState() {
  return useSelector((state: RootState) => state.quiz)
}

/**
 * Hook to get subscription state
 * @returns Subscription state
 */
export function useSubscriptionState() {
  return useSelector((state: RootState) => state.subscription)
}
