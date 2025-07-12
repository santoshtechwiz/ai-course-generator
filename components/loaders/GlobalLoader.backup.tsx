// Backup of previous GlobalLoader implementation

"use client"

import React from "react"
import { Loader as LoaderIcon } from "lucide-react"
import { useGlobalLoader } from "@/store/global-loader"
import { cn } from "@/lib/utils"

const typeStyles: Record<string, string> = {
  default: "bg-black/60 text-white",
  card: "bg-white/90 text-primary border border-primary",
  course: "bg-blue-50 text-blue-700 border border-blue-200",
  section: "bg-gray-900/80 text-white border border-gray-700",
}

export function GlobalLoader() {
  const { isLoading, message, type } = useGlobalLoader()
  if (!isLoading) return null

  const style = typeStyles[type || "default"]

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center transition-all",
      style
    )}>
      <div className="flex flex-col items-center space-y-4 p-8 rounded-xl shadow-2xl">
        <LoaderIcon className="h-12 w-12 animate-spin" />
        {message && (
          <p className="text-lg font-medium text-center">{message}</p>
        )}
      </div>
    </div>
  )
}
