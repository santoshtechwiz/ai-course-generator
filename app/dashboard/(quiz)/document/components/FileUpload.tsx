"use client"

import type React from "react"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  maxSizeInMB?: number
}

export function FileUpload({ onFileSelect, maxSizeInMB = 0.5 }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024 // Convert MB to bytes

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) return

    // Check file size
    if (file.size > maxSizeInBytes) {
      toast({
        title: "File too large",
        description: `Please select a file smaller than ${maxSizeInMB}MB to avoid token limit errors.`,
        variant: "destructive",
      })
      return
    }

    // Check file type (optional)
    if (
      !file.type.includes("text/") &&
      !file.type.includes("application/pdf") &&
      !file.type.includes("application/msword") &&
      !file.type.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    ) {
      toast({
        title: "Invalid file type",
        description: "Please upload a text or document file (TXT, PDF, DOC, DOCX).",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    onFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    // Simulate the file input change
    const input = document.getElementById("file-upload") as HTMLInputElement
    if (input) {
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      input.files = dataTransfer.files

      // Trigger change event manually
      const event = new Event("change", { bubbles: true })
      input.dispatchEvent(event)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Upload Document</h3>
        <p className="text-xs text-muted-foreground">Max size: {maxSizeInMB}MB</p>
      </div>

      <Card
        className="border-dashed border-2 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileChange}
          accept=".txt,.pdf,.doc,.docx"
        />
        <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col items-center">
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">{selectedFile ? selectedFile.name : "Click to upload or drag and drop"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB` : "TXT, PDF, DOC, DOCX up to 0.5MB"}
          </p>
        </label>
      </Card>
    </div>
  )
}
