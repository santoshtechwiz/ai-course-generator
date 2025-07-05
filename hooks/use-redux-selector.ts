import { useSelector } from "react-redux"
import type { TypedUseSelectorHook } from "react-redux"
import type { RootState } from "@/store"
import { createSelector } from "@reduxjs/toolkit"

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
 * @deprecated Use useAuth from @/modules/auth instead
 */
export function useAuthState() {
  // Return null since auth state has been removed from Redux
  console.warn("useAuthState is deprecated and no longer functional. Use useAuth from @/modules/auth instead.")
  return null
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
