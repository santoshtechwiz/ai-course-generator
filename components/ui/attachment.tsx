"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { X, Paperclip, File, FileText, ImageIcon, FileArchive } from "lucide-react"
import Image from "next/image"
import { HashLoader } from "react-spinners"

export type AttachmentType = "image" | "document" | "archive" | "unknown"

export interface AttachmentProps {
  id: string
  name: string
  size?: number
  type?: AttachmentType
  url?: string
  thumbnailUrl?: string
  onRemove?: (id: string) => void
  isLoading?: boolean
  className?: string
}

function InlineSpinner({ size = 24, className = "" }: { size?: number; className?: string }) {
  return <HashLoader color="#3B82F6" size={size} className={className} />
}

export function Attachment({
  id,
  name,
  size,
  type = "unknown",
  url,
  thumbnailUrl,
  onRemove,
  isLoading = false,
  className,
}: AttachmentProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ""
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = () => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-5 w-5 text-primary" />
      case "document":
        return <FileText className="h-5 w-5 text-primary" />
      case "archive":
        return <FileArchive className="h-5 w-5 text-primary" />
      default:
        return <File className="h-5 w-5 text-primary" />
    }
  }

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-lg border bg-card p-3 transition-all",
        isHovered && "border-primary/50 shadow-sm",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-10 w-10 rounded-md bg-muted">
          <InlineSpinner size={20} />
        </div>
      ) : type === "image" && thumbnailUrl ? (
        <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted">
          {!isImageLoaded && <InlineSpinner size={20} className="absolute inset-0" />}
          <Image
            src={thumbnailUrl || "/api/placeholder"}
            alt={name}
            fill
            className={cn("object-cover transition-opacity duration-300", isImageLoaded ? "opacity-100" : "opacity-0")}
            onLoad={() => setIsImageLoaded(true)}
          />
        </div>
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">{getFileIcon()}</div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{name}</p>
          {isLoading && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Uploading...
            </span>
          )}
        </div>
        {size !== undefined && <p className="text-xs text-muted-foreground">{formatFileSize(size)}</p>}
      </div>

      <div className="flex items-center gap-2">
        {url && !isLoading && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Download file"
          >
            <Paperclip className="h-4 w-4" />
          </a>
        )}

        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(id)}
            className={cn(
              "rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors",
              "opacity-0 group-hover:opacity-100 focus:opacity-100",
            )}
            aria-label="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export function AttachmentUploader({
  onFileSelect,
  isLoading = false,
  accept = "*/*",
  maxSize = 10, // in MB
  className,
}: {
  onFileSelect: (file: File) => void
  isLoading?: boolean
  accept?: string
  maxSize?: number
  className?: string
}) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      validateAndProcessFile(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      validateAndProcessFile(file)
      e.target.value = "" // Reset input
    }
  }

  const validateAndProcessFile = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size exceeds the ${maxSize}MB limit.`)
      return
    }

    onFileSelect(file)
  }

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 border-dashed p-6 transition-all",
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/30",
        isLoading && "opacity-70 pointer-events-none",
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileChange}
        accept={accept}
        disabled={isLoading}
      />

      <div className="flex flex-col items-center justify-center gap-2 text-center">
        {isLoading ? (
          <InlineSpinner size={24} />
        ) : (
          <>
            <div className="rounded-full bg-primary/10 p-3">
              <Paperclip className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">Drag & drop a file or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">Max file size: {maxSize}MB</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
