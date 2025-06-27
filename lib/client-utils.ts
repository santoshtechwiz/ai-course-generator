/**
 * Safely execute browser-only code
 */
export function safeClientSide<T>(fn: () => T, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }
  
  try {
    return fn();
  } catch (error) {
    console.error('Client-side error:', error);
    return fallback;
  }
}

/**
 * Safe local storage operations
 */
export const safeStorage = {
  getItem<T>(key: string, defaultValue: T | null = null): T | null {
    return safeClientSide(() => {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) as T : defaultValue;
    }, defaultValue);
  },
  
  setItem(key: string, value: any): boolean {
    return safeClientSide(() => {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    }, false);
  },
  
  removeItem(key: string): boolean {
    return safeClientSide(() => {
      localStorage.removeItem(key);
      return true;
    }, false);
  }
};

/**
 * Safe session storage operations
 */
export const safeSessionStorage = {
  getItem<T>(key: string, defaultValue: T | null = null): T | null {
    return safeClientSide(() => {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) as T : defaultValue;
    }, defaultValue);
  },
  
  setItem(key: string, value: any): boolean {
    return safeClientSide(() => {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    }, false);
  },
  
  removeItem(key: string): boolean {
    return safeClientSide(() => {
      sessionStorage.removeItem(key);
      return true;
    }, false);
  }
};
