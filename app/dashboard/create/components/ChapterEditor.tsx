"use client"

import type React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X, Check } from "lucide-react"

interface ChapterEditorProps {
  title: string
  onTitleChange: (title: string) => void
  onSave: () => void
  onCancel: () => void
}

const ChapterEditor: React.FC<ChapterEditorProps> = ({ title, onTitleChange, onSave, onCancel }) => {
  return (
    <div className="flex items-center gap-2 mb-2 p-2 bg-muted/50 border-3 border-blue-500 rounded-none">
      <Input 
        value={title} 
        onChange={(e) => onTitleChange(e.target.value)} 
        className="flex-1 border-2 border-border rounded-none font-bold h-9 focus:border-blue-500 focus:ring-0" 
        autoFocus 
      />
      <Button 
        size="sm" 
        variant="outline" 
        onClick={onSave}
        className="h-9 w-9 p-0 border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white rounded-none font-black"
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button 
        size="sm" 
        variant="ghost" 
        onClick={onCancel}
        className="h-9 w-9 p-0 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-none font-black"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default ChapterEditor