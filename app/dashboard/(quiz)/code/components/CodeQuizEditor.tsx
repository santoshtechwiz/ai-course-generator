"use client"

import { useRef, useEffect, useState } from "react"
import { Editor } from "@monaco-editor/react"
import { cn } from "@/lib/tailwindUtils"

interface CodeQuizEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  language?: string
  height?: string
  placeholder?: string
  readOnly?: boolean
  disabled?: boolean
  className?: string
  [key: string]: any // For data-testid and other props
}

export default function CodeQuizEditor({
  value,
  onChange,
  language = "javascript",
  height = "300px",
  placeholder = "// Write your code here",
  readOnly = false,
  disabled = false,
  className,
  ...rest
}: CodeQuizEditorProps) {
  const editorRef = useRef(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div
        className={cn(
          "border rounded-md bg-muted/50 w-full p-4 font-mono text-sm overflow-auto whitespace-pre",
          disabled && "opacity-70 pointer-events-none",
          className,
        )}
        style={{ height }}
      >
        {value || placeholder}
      </div>
    )
  }

  return (
    <div className={cn("border rounded-md overflow-hidden", disabled && "opacity-80 pointer-events-none", className)}>
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={onChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          folding: true,
          lineNumbers: "on",
          wordWrap: "on",
          readOnly: readOnly || disabled,
          domReadOnly: readOnly || disabled,
          contextmenu: !readOnly && !disabled,
          cursorStyle: readOnly || disabled ? "line-thin" : "line",
        }}
        {...rest}
      />
    </div>
  )
}
