"use client"

import type React from "react"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FileUploadProps {
  onFileSelect: (file: File) => void
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      onFileSelect(file)
    }
  }

  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="document">Upload Document (PDF or Word)</Label>
      <Input id="document" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
      <Button variant="outline" onClick={() => document.getElementById("document")?.click()} className="w-full">
        <Upload className="mr-2 h-4 w-4" />
        {fileName || "Select File"}
      </Button>
    </div>
  )
}

