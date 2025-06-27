import { Middleware } from 'redux';
import { RootState } from '@/store';

// Safe storage utilities for browser-only environments
export const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(key) || sessionStorage.getItem(key);
      } catch (e) {
        console.error(`Error reading from storage for key "${key}"`, e);
      }
    }
    return null;
  },

  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, value);
        sessionStorage.setItem(key, value);
      } catch (e) {
        console.error(`Error writing to storage for key "${key}"`, e);
      }
    }
  },

  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (e) {
        console.error(`Error removing storage key "${key}"`, e);
      }
    }
  }
};

// 🧠 Load and parse a persisted state object from storage
export function hydrateFromStorage<T = any>(key: string): T | null {
  const raw = safeStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to parse storage JSON for key "${key}"`, e);
    return null;
  }
}

// 🔁 Persist entire or partial Redux state with whitelist/blacklist support
interface PersistConfig {
  key: string;
  whitelist?: (keyof RootState)[];
  blacklist?: (keyof RootState)[];
}

export const createPersistMiddleware = (config: PersistConfig): Middleware => {
  return store => next => action => {
    const result = next(action);
    if (typeof window === 'undefined') return result;

    const fullState = store.getState();

    let filteredState: Partial<RootState> = { ...fullState };

    if (config.whitelist) {
      filteredState = config.whitelist.reduce((acc, key) => {
        acc[key] = fullState[key];
        return acc;
      }, {} as Partial<RootState>);
    }

    if (config.blacklist) {
      config.blacklist.forEach(key => {
        delete filteredState[key];
      });
    }

    try {
      const json = JSON.stringify(filteredState);
      safeStorage.setItem(config.key, json);
    } catch (e) {
      console.error(`Error persisting state under key "${config.key}"`, e);
    }

    return result;
  };
};

// 🎯 Persist a single slice of Redux state (e.g. flashcard slice only)
export const createSlicePersistMiddleware = <K extends keyof RootState>(
  slice: K,
  storageKey: string
): Middleware<{}, RootState> => {
  return store => next => action => {
    const result = next(action);
    if (typeof window === 'undefined') return result;

    try {
      const sliceData = store.getState()[slice];
      const json = JSON.stringify(sliceData);
      safeStorage.setItem(storageKey, json);
    } catch (e) {
      console.error(`Failed to persist slice "${String(slice)}" to "${storageKey}"`, e);
    }

    return result;
  };
};
