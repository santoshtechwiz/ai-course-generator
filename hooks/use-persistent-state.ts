"use client"

import { useState, useEffect } from "react"

/**
 * Hook for state that persists in localStorage
 * @param key The localStorage key
 * @param initialValue The initial state value
 * @param options Additional options
 * @returns [state, setState] tuple
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
  options: {
    serialize?: (value: T) => string
    deserialize?: (value: string) => T
    storage?: Storage
  } = {},
): [T, (value: T | ((prev: T) => T)) => void] {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    storage = typeof window !== "undefined" ? window.localStorage : null,
  } = options

  // Get initial state from storage or use initialValue
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined" || !storage) {
      return initialValue
    }

    try {
      const item = storage.getItem(key)
      return item ? deserialize(item) : initialValue
    } catch (error) {
      console.error(`Error reading '${key}' from storage:`, error)
      return initialValue
    }
  })

  // Update storage when state changes
  useEffect(() => {
    if (!storage) return

    try {
      if (state === undefined) {
        storage.removeItem(key)
      } else {
        storage.setItem(key, serialize(state))
      }
    } catch (error) {
      console.error(`Error writing '${key}' to storage:`, error)
    }
  }, [key, state, serialize, storage])

  // Sync state with other tabs/windows
  useEffect(() => {
    if (!storage || typeof window === "undefined") return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key || e.storageArea !== storage) return

      try {
        const newValue = e.newValue ? deserialize(e.newValue) : initialValue
        setState(newValue)
      } catch (error) {
        console.error(`Error syncing '${key}' from storage:`, error)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [key, initialValue, deserialize, storage])

  return [state, setState]
}
