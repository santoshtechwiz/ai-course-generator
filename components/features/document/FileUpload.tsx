"use client"

import { useState } from "react"
import { Upload, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    <Card>
      <CardHeader>
        <CardTitle></CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center space-y-4">
          <Label htmlFor="document" className="flex flex-col items-center justify-center space-y-2 cursor-pointer">
            <div className="p-4 border-2 border-dashed rounded-lg hover:bg-accent/50 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">Click to upload or drag and drop</span>
            <span className="text-xs text-muted-foreground">PDF or Word documents</span>
          </Label>
          <Input id="document" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
          {fileName && (
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{fileName}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}