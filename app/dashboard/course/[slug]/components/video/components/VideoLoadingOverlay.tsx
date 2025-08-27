"use client"

import { VideoLoadingOverlayProps } from '../types'

export default function VideoLoadingOverlay({
  isVisible,
  message = "Loading video..."
}: VideoLoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
      <div className="flex flex-col items-center gap-4 text-white">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  )
}
