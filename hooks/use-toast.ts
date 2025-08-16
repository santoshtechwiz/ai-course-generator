"use client"

import { useState, useEffect, useCallback } from "react"

export type ToastVariant = "default" | "success" | "error" | "warning" | "info" | "destructive"

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Enhanced hook for managing toast notifications
 * @returns Toast state and methods
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  // Add a new toast
  const toast = useCallback(({ title, description, variant = "default", duration = 5000, action }: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      id,
      title,
      description,
      variant,
      duration,
      action,
    }

    setToasts((prev) => [...prev, newToast])
    return id
  }, [])

  // Convenience methods for different toast types
  const success = useCallback((title: string, description?: string, options?: Partial<ToastOptions>) => {
    return toast({ title, description, variant: "success", ...options })
  }, [toast])

  const error = useCallback((title: string, description?: string, options?: Partial<ToastOptions>) => {
    return toast({ title, description, variant: "destructive", ...options })
  }, [toast])

  const warning = useCallback((title: string, description?: string, options?: Partial<ToastOptions>) => {
    return toast({ title, description, variant: "warning", ...options })
  }, [toast])

  const info = useCallback((title: string, description?: string, options?: Partial<ToastOptions>) => {
    return toast({ title, description, variant: "info", ...options })
  }, [toast])

  // Remove a toast by ID
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  // Clear all toasts
  const clearAll = useCallback(() => {
    setToasts([])
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
    success,
    error,
    warning,
    info,
    dismiss,
    clearAll,
  }
}

// Create a singleton instance for global usage
let toastInstance: ReturnType<typeof useToast> | null = null

// This is a workaround for using toasts outside of React components
if (typeof window !== "undefined") {
  // @ts-ignore - Create a global variable for the toast instance
  window.__toastInstance = window.__toastInstance || {
    toasts: [],
    toast: ({ title, description, variant, duration, action }: ToastOptions) => {
      console.log("Toast:", title, description)
      return "mock-id"
    },
    success: (title: string, description?: string) => {
      console.log("Success Toast:", title, description)
      return "mock-id"
    },
    error: (title: string, description?: string) => {
      console.log("Error Toast:", title, description)
      return "mock-id"
    },
    warning: (title: string, description?: string) => {
      console.log("Warning Toast:", title, description)
      return "mock-id"
    },
    info: (title: string, description?: string) => {
      console.log("Info Toast:", title, description)
      return "mock-id"
    },
    dismiss: (id: string) => {},
    clearAll: () => {},
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

// Export convenience functions for global usage
export const toastSuccess = (title: string, description?: string) => {
  if (toastInstance) {
    return toastInstance.success(title, description)
  }
  console.log("Success Toast:", title, description)
  return "mock-id"
}

export const toastError = (title: string, description?: string) => {
  if (toastInstance) {
    return toastInstance.error(title, description)
  }
  console.log("Error Toast:", title, description)
  return "mock-id"
}

export const toastWarning = (title: string, description?: string) => {
  if (toastInstance) {
    return toastInstance.warning(title, description)
  }
  console.log("Warning Toast:", title, description)
  return "mock-id"
}

export const toastInfo = (title: string, description?: string) => {
  if (toastInstance) {
    return toastInstance.info(title, description)
  }
  console.log("Info Toast:", title, description)
  return "mock-id"
}
