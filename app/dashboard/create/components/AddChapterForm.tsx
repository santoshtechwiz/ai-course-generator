"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from 'next/image'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
    <div className="mt-4 border rounded-md p-3 space-y-3">
      <h4 className="font-medium">Add New Chapter</h4>
      <div className="space-y-2">
        <Input placeholder="Chapter title" value={title} onChange={(e) => onTitleChange(e.target.value)} />
        <div className="space-y-1">
          <Input
            placeholder="YouTube Video ID or URL (optional)"
            value={youtubeId}
            onChange={(e) => onYoutubeIdChange(e.target.value)}
            className={cn(
              validatedId
                ? "border-green-500 focus-visible:ring-green-500"
                : youtubeId && !validatedId
                  ? "border-red-500 focus-visible:ring-red-500"
                  : "",
            )}
          />
          {youtubeId && !validatedId && <p className="text-xs text-red-500">Please enter a valid YouTube ID or URL</p>}
          {!youtubeId && (
            <p className="text-xs text-muted-foreground">
              Enter a valid YouTube ID (11 characters) or URL, or leave blank to generate later
            </p>
          )}
          {validatedId && (
            <div className="mt-2 border rounded-md p-2">
              <p className="text-xs text-green-500 mb-1">Video ID validated: {validatedId}</p>
              <div className="relative aspect-video bg-muted rounded-md">
                <Image
                  src={`https://img.youtube.com/vi/${validatedId}/hqdefault.jpg`}
                  alt="Video thumbnail"
                  fill
                  className="object-cover rounded-md"
                  sizes="100vw"
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={onAdd}>
            Add Chapter
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AddChapterForm
