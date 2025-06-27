import { useRef, useEffect, useMemo } from 'react';
import { shallow } from 'zustand/shallow';

/**
 * Custom hook that implements shallow equality comparison for Zustand selectors
 * to prevent unnecessary re-renders
 */
export function useShallow<T>(selector: T): T {
  const ref = useRef<T>(selector);
  
  // Only update the ref if the selector has changed according to shallow comparison
  if (!shallow(ref.current as any, selector as any)) {
    ref.current = selector;
  }
  
  return ref.current;
}

/**
 * Creates a memoized selector that will only trigger re-renders when the selected state changes
 */
export function createSelector<State, Selected>(
  selector: (state: State) => Selected
) {
  return (state: State) => {
    const selected = selector(state);
    // Using useMemo to prevent creating new references
    return useMemo(() => selected, [selected]);
  };
}
