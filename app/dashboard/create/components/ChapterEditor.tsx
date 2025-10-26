"use client"

import type React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface ChapterEditorProps {
  title: string
  onTitleChange: (title: string) => void
  onSave: () => void
  onCancel: () => void
}

const ChapterEditor: React.FC<ChapterEditorProps> = ({ title, onTitleChange, onSave, onCancel }) => {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="flex-1 border-4 border-border focus:ring-2 focus:ring-ring focus:border-ring"
        autoFocus
        aria-label="Edit chapter title"
      />
      <Button
        size="sm"
        onClick={onSave}
        className="bg-accent text-background border-4 border-border shadow-neo font-black uppercase"
        aria-label="Save chapter title"
      >
        Save
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onCancel}
        className="border-4 border-border"
        aria-label="Cancel editing"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default ChapterEditor
