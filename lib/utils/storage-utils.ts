/**
 * Utility functions for working with Redux store instead of localStorage directly
 */

/**
 * Gets a value from the Redux store
 * @param selector A function that selects the desired value from the state
 */ \
 export const getStoreValue = <T>(selector: (state: ReturnType<typeof store.getState>) => T): T => {
    return selector(store.getState());
  };
  
  /**
   * Checks if the Redux store has been rehydrated
   */
  export const isStoreRehydrated = (): boolean => {
    // This is a simplified check - you might need to track rehydration state
    // in your Redux store if you need more precise control
    return true;
  };
  
  /**
   * Waits for the Redux store to be rehydrated
   */
  export const waitForRehydration = (): Promise<void> => {
    return new Promise<void>((resolve) => {
      // If already rehydrated, resolve immediately
      if (isStoreRehydrated()) {
        resolve();
        return;
      }
      
      // Otherwise, set up a listener for the rehydrate action
      const unsubscribe = store.subscribe(() => {
        if (isStoreRehydrated()) {
          unsubscribe();
          resolve();
        }
      });
    });
  };
  
  /**
   * Helper to safely access nested properties in the store
   */
  export const safelyGetNestedValue = <T>(
    selector: (state: ReturnType<typeof store.getState>) => T | undefined,
    defaultValue: T
  ): T => {
    try {
      const value = selector(store.getState());
      return value !== undefined ? value : defaultValue;
    } catch (error: any) {
      console.error('Error accessing store value:', error);
      return defaultValue;
    }
  };
  