"use client"

import React from "react"

interface Props {
  currentIndex: number
  hasCurrentChapter: boolean
  total: number
}

export default function MobilePlaylistCount({ currentIndex, hasCurrentChapter, total }: Props) {
  // This component is client-only to avoid SSR hydration mismatches for runtime values
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>
        {hasCurrentChapter ? `${currentIndex + 1}/${total}` : `0/${total}`}
      </span>
      {hasCurrentChapter && (
        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / Math.max(1, total)) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}
