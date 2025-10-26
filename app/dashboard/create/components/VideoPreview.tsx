"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface VideoPreviewProps {
  videoId: string
  title?: string
}

export default function VideoPreview({ videoId, title = "Preview Video" }: VideoPreviewProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscKey)
      return () => document.removeEventListener("keydown", handleEscKey)
    }
  }, [open])

  return (
    <>
      {/* Thumbnail */}
      <div
        onClick={() => setOpen(true)}
        className="cursor-pointer border-4 border-border rounded-lg hover:scale-[1.02] transition-transform bg-card shadow-neo overflow-hidden"
      >
        <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} alt={title} className="w-full h-auto" />
        <div className="p-2 text-xs font-semibold text-card-foreground">{title}</div>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Video preview: ${title}`}
        >
          <div
            className="relative w-full max-w-2xl bg-card border-4 border-border rounded-lg shadow-neo p-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close video preview"
              className="absolute top-3 right-3 bg-card text-foreground border-4 border-border p-1.5 rounded hover:opacity-80 transition-opacity z-10 shadow-neo"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Video container - responsive aspect ratio */}
            <div className="relative w-full pt-[56.25%] border-4 border-border rounded overflow-hidden shadow-neo">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={title}
              />
            </div>

            {/* Title */}
            <div className="mt-3 text-center font-semibold text-sm text-foreground">{title}</div>

            {/* ESC hint */}
            <div className="mt-2 text-center text-xs text-muted-foreground">Press ESC to close</div>
          </div>
        </div>
      )}
    </>
  )
}
