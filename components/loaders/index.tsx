"use client"
import React from "react"
import { LoadingSpinner, LoadingSkeleton, LoadingOverlay, UnifiedLoader } from "./GlobalLoader"
export * from "./GlobalLoader"
export * from "./LoaderContext"
export * from "./hooks"
export * from "./ApiLoadingWrapper"

export function SuspenseGlobalFallback({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <LoadingSpinner message={text} />
    </div>
  )
}

export default SuspenseGlobalFallback
