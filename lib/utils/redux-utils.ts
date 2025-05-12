// This file is now simplified as most functionality is moved to store/index.ts
import { useSelector } from "react-redux"
import type { TypedUseSelectorHook } from "react-redux"
import type { RootState } from "@/store"

/**
 * Type-safe selector hook for accessing Redux state
 * @deprecated Use useAppSelector from @/store instead
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

/**
 * Creates a memoized selector that only triggers re-renders when the selected value changes
 * @param selector The selector function
 * @param equalityFn Optional equality function
 * @returns The selected value
 */
export function createSelector<TState, TSelected>(
  selector: (state: TState) => TSelected,
  equalityFn?: (left: TSelected, right: TSelected) => boolean,
) {
  let lastState: TState | undefined
  let lastSelected: TSelected | undefined

  return function memoizedSelector(state: TState): TSelected {
    if (lastState === state && lastSelected !== undefined) {
      return lastSelected
    }

    const selected = selector(state)

    if (lastSelected !== undefined && equalityFn && equalityFn(lastSelected, selected)) {
      return lastSelected
    }

    lastState = state
    lastSelected = selected
    return selected
  }
}

/**
 * Creates an action creator with a type and payload
 * @param type The action type
 * @returns An action creator function
 */
export function createAction<T extends string, P>(type: T) {
  return (payload: P) => ({ type, payload })
}
