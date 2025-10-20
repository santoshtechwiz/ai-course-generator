import { useRef, useCallback } from "react"
import { useToast } from "@/hooks"

interface ToastOptions {
  title: string
  description?: string
  variant?: "default" | "destructive"
}

export function useToastThrottle(throttleMs: number = 1000) {
  const { toast } = useToast()
  const lastToastTimeRef = useRef<Record<string, number>>({})
  const toastQueueRef = useRef<ToastOptions | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showThrottledToast = useCallback(
    (options: ToastOptions) => {
      const key = `${options.title}-${options.variant || "default"}`
      const now = Date.now()
      const lastTime = lastToastTimeRef.current[key] || 0

      // Clear pending timeout if exists
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      if (now - lastTime >= throttleMs) {
        // Show toast immediately if throttle window has passed
        toast(options)
        lastToastTimeRef.current[key] = now
      } else {
        // Queue the toast to show after throttle period
        toastQueueRef.current = options
        const remainingMs = throttleMs - (now - lastTime)

        timeoutRef.current = setTimeout(() => {
          if (toastQueueRef.current) {
            toast(toastQueueRef.current)
            lastToastTimeRef.current[key] = Date.now()
            toastQueueRef.current = null
          }
        }, remainingMs)
      }
    },
    [toast, throttleMs]
  )

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  return { showThrottledToast, cleanup }
}
