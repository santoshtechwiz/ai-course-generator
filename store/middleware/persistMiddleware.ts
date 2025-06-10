import { Middleware } from 'redux';
import { RootState } from '@/store';

// Safe storage access to handle SSR and edge cases
export const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error(`Error accessing localStorage for key ${key}:`, e);
        return null;
      }
    }
    return null;
  },
  
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
        
        // Also try to store in sessionStorage as backup
        try {
          sessionStorage.setItem(key, value);
        } catch (e) {
          console.error(`Error setting sessionStorage backup for key ${key}:`, e);
        }
      } catch (e) {
        console.error(`Error setting localStorage for key ${key}:`, e);
      }
    }
  },
  
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
        
        // Also clean up sessionStorage backup
        try {
          sessionStorage.removeItem(key);
        } catch (e) {
          console.error(`Error removing sessionStorage backup for key ${key}:`, e);
        }
      } catch (e) {
        console.error(`Error removing localStorage for key ${key}:`, e);
      }
    }
  }
};

// Helper to hydrate state from storage with fallback to sessionStorage
export function hydrateFromStorage<T>(key: string): T | null {
  // Try localStorage first
  const storedData = safeStorage.getItem(key);
  if (storedData) {
    try {
      return JSON.parse(storedData) as T;
    } catch (e) {
      console.error(`Error parsing stored data for key ${key}:`, e);
    }
  }
  
  // If localStorage failed, try sessionStorage as fallback
  if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
    try {
      const sessionData = sessionStorage.getItem(key);
      if (sessionData) {
        return JSON.parse(sessionData) as T;
      }
    } catch (e) {
      console.error(`Error accessing sessionStorage for key ${key}:`, e);
    }
  }
  
  return null;
}

// Configuration for persistence
export interface PersistConfig {
  key: string;
  whitelist?: string[];
  blacklist?: string[];
}

// Create the middleware function
export const createPersistMiddleware = (config: PersistConfig) => {
  return store => next => action => {
    // Run the action first
    const result = next(action);
    
    // Get the updated state
    const state = store.getState();
    
    // Skip if in SSR
    if (typeof window === 'undefined') {
      return result;
    }
    
    // Filter the state based on whitelist/blacklist
    let persistState: any = { ...state };
    
    // Apply whitelist if specified
    if (config.whitelist && config.whitelist.length > 0) {
      persistState = {};
      config.whitelist.forEach(key => {
        if (state[key] !== undefined) {
          persistState[key] = state[key];
        }
      });
    }
    
    // Apply blacklist if specified
    if (config.blacklist && config.blacklist.length > 0) {
      config.blacklist.forEach(key => {
        if (persistState[key] !== undefined) {
          delete persistState[key];
        }
      });
    }
    
    // Store the filtered state
    try {
      safeStorage.setItem(config.key, JSON.stringify(persistState));
    } catch (e) {
      console.error('Failed to persist state:', e);
    }
    
    return result;
  };
};

// Helper to create a more specific middleware for a slice
export const createSlicePersistMiddleware = (sliceName: string, storageKey: string) => {
  return store => next => action => {
    // Run the action first
    const result = next(action);
    
    // Get the updated state
    const state = store.getState();
    
    // Skip if in SSR
    if (typeof window === 'undefined') {
      return result;
    }
    
    // Only persist the specific slice
    if (state[sliceName]) {
      try {
        safeStorage.setItem(storageKey, JSON.stringify(state[sliceName]));
      } catch (e) {
        console.error(`Failed to persist ${sliceName} slice:`, e);
      }
    }
    
    return result;
  };
};
