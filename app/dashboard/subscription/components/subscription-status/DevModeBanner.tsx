"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "devBannerDismissed"

// Dismissible DevModeBanner — lightweight, accessible, and persistent per-browser
export default function DevModeBanner() {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      setDismissed(stored === "1")
    } catch (e) {
      // ignore — localStorage may be unavailable in some environments
    }
  }, [])

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch (e) {
      // ignore
    }
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div
      className="bg-[var(--color-accent)]/10 border border-[var(--color-accent)] text-[var(--color-text)] p-4 mb-8 rounded-md"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 text-[var(--color-accent)]" aria-hidden />
          <div>
            <p className="font-bold text-[var(--color-text)]">Development Mode</p>
            <p className="text-sm text-[var(--color-text)]/70">You are currently in development mode. Stripe payments are in test mode.</p>
          </div>
        </div>

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Dismiss development mode banner"
            onClick={handleDismiss}
            className="h-7 w-7 text-[var(--color-text)]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
