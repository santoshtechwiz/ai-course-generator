"use client"

import { useState, useEffect } from "react"
import { X, Play } from "lucide-react"

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
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener("keydown", handleEscKey)
        document.body.style.overflow = 'unset'
      }
    }
  }, [open])

  return (
    <>
      {/* Video Thumbnail Card - NEOBRUTAL STYLED */}
      <div
        onClick={() => setOpen(true)}
        className="cursor-pointer border-4 border-black rounded-none hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden group"
      >
        {/* Video Thumbnail */}
        <div className="relative w-full aspect-video bg-gray-200 overflow-hidden">
          <img
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt={title}
            className="w-full h-full object-cover"
          />
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-300">
            <div className="p-3 md:p-4 rounded-none bg-error text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-4 border-border group-hover:scale-110 transition-transform">
              <Play className="h-6 w-6 md:h-8 md:w-8 fill-current" />
            </div>
          </div>
        </div>
        
        {/* Title */}
        <div className="p-3 md:p-4 bg-white border-t-4 border-black">
          <p className="text-sm md:text-base font-bold text-black line-clamp-2">{title}</p>
        </div>
      </div>

      {/* Modal Overlay - NEOBRUTAL STYLED */}
      {open && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Video preview: ${title}`}
        >
          <div
            className="relative w-full max-w-4xl bg-white border-4 md:border-6 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 md:p-6 max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - NEOBRUTAL */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close video preview"
              className="absolute -top-3 -right-3 md:-top-4 md:-right-4 bg-error text-foreground border-4 border-border p-2 md:p-3 rounded-none hover:bg-error hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all z-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <X className="h-5 w-5 md:h-6 md:w-6 font-bold" strokeWidth={3} />
            </button>

            {/* Title Bar - NEOBRUTAL */}
            <div className="mb-4 pb-4 border-b-4 border-border bg-warning -mx-4 md:-mx-6 -mt-4 md:-mt-6 px-4 md:px-6 pt-4 md:pt-6">
              <h2 className="text-lg md:text-2xl font-black text-foreground uppercase pr-8 md:pr-12">
                {title}
              </h2>
            </div>

            {/* Video Container - NEOBRUTAL */}
            <div className="relative w-full pt-[56.25%] border-4 border-black rounded-none overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={title}
              />
            </div>

            {/* Footer - NEOBRUTAL */}
            <div className="mt-4 p-3 md:p-4 bg-primary border-4 border-border rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <p className="text-xs md:text-sm font-bold text-foreground">
                  <kbd className="px-2 py-1 bg-white border-2 border-black rounded-none font-mono text-xs">ESC</kbd>
                  <span className="ml-2">Press ESC to close</span>
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-white text-black border-4 border-black rounded-none font-black text-sm md:text-base hover:bg-gray-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}