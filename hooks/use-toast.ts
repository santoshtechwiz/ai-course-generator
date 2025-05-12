"use client"

import { useState, useEffect, useCallback } from "react"

export type ToastVariant = "default" | "success" | "error" | "warning" | "info" | "destructive"

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

/**
 * Hook for managing toast notifications
 * @returns Toast state and methods
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  // Add a new toast
  const toast = useCallback(({ title, description, variant = "default", duration = 5000 }: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      id,
      title,
      description,
      variant,
      duration,
    }

    setToasts((prev) => [...prev, newToast])
    return id
  }, [])

  // Remove a toast by ID
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  // Auto-dismiss toasts after their duration
  useEffect(() => {
    const timers = toasts.map((toast) => {
      return setTimeout(() => {
        dismiss(toast.id)
      }, toast.duration || 5000)
    })

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [toasts, dismiss])

  return {
    toasts,
    toast,
    dismiss,
  }
}

// Create a singleton instance for global usage
let toastInstance: ReturnType<typeof useToast> | null = null

// This is a workaround for using toasts outside of React components
if (typeof window !== "undefined") {
  // @ts-ignore - Create a global variable for the toast instance
  window.__toastInstance = window.__toastInstance || {
    toasts: [],
    toast: ({ title, description, variant, duration }: ToastOptions) => {
      console.log("Toast:", title, description)
      return "mock-id"
    },
    dismiss: (id: string) => {},
  }

  // @ts-ignore - Get the global toast instance
  toastInstance = window.__toastInstance
}

// Export a simplified toast function for use outside of React components
export const toast = (options: ToastOptions) => {
  if (toastInstance) {
    return toastInstance.toast(options)
  }

  // Fallback for server-side
  console.log("Toast:", options.title, options.description)
  return "mock-id"
}
