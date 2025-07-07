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
      <Input value={title} onChange={(e) => onTitleChange(e.target.value)} className="flex-1" autoFocus />
      <Button size="sm" variant="outline" onClick={onSave}>
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default ChapterEditor
