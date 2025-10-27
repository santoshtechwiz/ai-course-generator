"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createThumbnailErrorHandler, getYouTubeThumbnailUrl } from "@/utils/youtube-thumbnails"

interface AddChapterFormProps {
  youtubeId: string
  title: string
  onYoutubeIdChange: (id: string) => void
  onTitleChange: (title: string) => void
  onAdd: () => void
  onCancel: () => void
  extractYoutubeIdFromUrl: (url: string) => string | null
}

const AddChapterForm: React.FC<AddChapterFormProps> = ({
  youtubeId,
  title,
  onYoutubeIdChange,
  onTitleChange,
  onAdd,
  onCancel,
  extractYoutubeIdFromUrl,
}) => {
  const [validatedId, setValidatedId] = useState<string | null>(null)

  // Validate YouTube ID as user types
  useEffect(() => {
    const id = youtubeId ? extractYoutubeIdFromUrl(youtubeId) : null
    setValidatedId(id)
  }, [youtubeId, extractYoutubeIdFromUrl])

  return (
    <div className="mt-4 border-4 border-border rounded-none p-3 sm:p-4 space-y-3 bg-card shadow-neo">
      <h4 className="font-black uppercase text-foreground text-sm sm:text-base">Add New Chapter</h4>
      <div className="space-y-2">
        <Input
          placeholder="Chapter title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="border-4 border-border text-sm sm:text-base py-2 sm:py-3"
        />
        <div className="space-y-1">
          <Input
            placeholder="YouTube Video ID or URL (optional)"
            value={youtubeId}
            onChange={(e) => onYoutubeIdChange(e.target.value)}
            className={cn(
              "border-4 border-border text-sm sm:text-base py-2 sm:py-3",
              validatedId
                ? "border-accent focus-visible:ring-accent"
                : youtubeId && !validatedId
                  ? "border-destructive focus-visible:ring-destructive"
                  : "",
            )}
          />
          {youtubeId && !validatedId && (
            <p className="text-xs text-destructive">Please enter a valid YouTube ID or URL</p>
          )}
          {!youtubeId && (
            <p className="text-xs text-muted-foreground">
              Enter a valid YouTube ID (11 characters) or URL, or leave blank to generate later
            </p>
          )}
          {validatedId && (
            <div className="mt-2 border-4 border-border rounded-none p-2 bg-card">
              <p className="text-xs text-accent mb-2 font-medium">Video ID validated: {validatedId}</p>
              <div className="relative aspect-video bg-muted rounded-none border-4 border-border overflow-hidden">
                <Image
                  src={getYouTubeThumbnailUrl(validatedId, "hqdefault") || "/placeholder.svg"}
                  alt="Video thumbnail"
                  fill
                  className="object-cover rounded-none"
                  sizes="100vw"
                  onError={createThumbnailErrorHandler(validatedId)}
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            className="border-4 border-border shadow-neo bg-transparent text-sm sm:text-base py-2 sm:py-3"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onAdd}
            className="bg-accent text-background border-4 border-border shadow-neo font-black uppercase text-sm sm:text-base py-2 sm:py-3"
          >
            Add Chapter
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AddChapterForm
