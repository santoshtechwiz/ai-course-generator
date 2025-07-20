"use client"

import { useRef, useEffect, useState } from "react"
import Editor from "@monaco-editor/react"
import { cn } from "@/lib/utils"

interface CodeQuizEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  language?: string
  height?: string | number
  placeholder?: string
  readOnly?: boolean
  disabled?: boolean
  className?: string
  [key: string]: any
}

const LANGUAGE_MAP: Record<string, string> = {
  javascript: "javascript",
  "JavaScript": "javascript",
  "JAVASCRIPT": "javascript",
  typescript: "typescript",
  "TypeScript": "typescript",
  "TYPESCRIPT": "typescript",
  python: "python",
  "Python": "python",
  "PYTHON": "python",
  java: "java",
  "Java": "java",
  "JAVA": "java",
  csharp: "csharp",
  "C#": "csharp",
  "CSHARP": "csharp",
  cpp: "cpp",
  "C++": "cpp",
  "CPP": "cpp",
  go: "go",
  "Go": "go",
  "GO": "go",
  rust: "rust",
  "Rust": "rust",
  "RUST": "rust",
  php: "php",
  "PHP": "php",
  ruby: "ruby",
  "Ruby": "ruby",
  "RUBY": "ruby",
  html: "html",
  "HTML/CSS": "html",
  "HTML": "html",
  "CSS": "css",
  css: "css",
  sql: "sql",
  "SQL": "sql",
  bash: "shell",
  "Bash/Shell": "shell",
  "Bash Scripting": "shell",      // <-- Add this mapping
  "Bash Scripting": "shell",      // <-- Add this mapping
  "Bash script": "shell",
  "Bash Script": "shell",
  "BASH SCRIPT": "shell",
  "BASH": "shell",
  "SHELL": "shell",
  shell: "shell",
  "Shell": "shell",
  powershell: "powershell",
  "PowerShell": "powershell",
  "POWERSHELL": "powershell",
  r: "r",
  "R": "r",
  scala: "scala",
  "Scala": "scala",
  "SCALA": "scala",
  dart: "dart",
  "Dart": "dart",
  "DART": "dart",
  lua: "lua",
  "Lua": "lua",
  "LUA": "lua",
  perl: "perl",
  "Perl": "perl",
  "PERL": "perl",
  haskell: "haskell",
  "Haskell": "haskell",
  "HASKELL": "haskell",
  clojure: "clojure",
  "Clojure": "clojure",
  "CLOJURE": "clojure",
  fsharp: "fsharp",
  "F#": "fsharp",
  "FSHARP": "fsharp",
  vb: "vb",
  "VB.NET": "vb",
  "VB": "vb",
  objectivec: "objective-c",
  "Objective-C": "objective-c",
  "OBJECTIVE-C": "objective-c",
  assembly: "assembly",
  "Assembly": "assembly",
  "ASSEMBLY": "assembly",
  matlab: "matlab",
  "MATLAB": "matlab",
  groovy: "groovy",
  "Groovy": "groovy",
  "GROOVY": "groovy",
  elixir: "elixir",
  "Elixir": "elixir",
  "ELIXIR": "elixir",
  erlang: "erlang",
  "Erlang": "erlang",
  "ERLANG": "erlang",
  crystal: "crystal",
  "Crystal": "crystal",
  "CRYSTAL": "crystal",
  nim: "nim",
  "Nim": "nim",
  "NIM": "nim",
  zig: "zig",
  "Zig": "zig",
  "ZIG": "zig",
  // fallback
  default: "plaintext",
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
  const [editorError, setEditorError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
    setIsLoading(false)
    setEditorError(null)

    // Set placeholder if value is empty
    if (!value && placeholder) {
      editor.setValue(placeholder)
    }
  }

  const handleEditorError = (error: any) => {
    console.error("Monaco editor error:", error)
    setEditorError("Editor failed to load")
    setIsLoading(false)
  }

  const handleEditorChange = (newValue: string | undefined) => {
    if (!disabled && !readOnly) {
      onChange(newValue)
    }
  }

  // Normalize language for Monaco
  const normalizedLanguage =
    LANGUAGE_MAP[language.trim()] ||
    LANGUAGE_MAP[language.trim().toLowerCase()] ||
    LANGUAGE_MAP[language.trim().toUpperCase()] ||
    LANGUAGE_MAP.default;

  if (!isMounted) {
    return (
      <div
        className={cn(
          "border rounded-md bg-muted/50 w-full p-4 font-mono text-sm overflow-auto whitespace-pre flex items-center justify-center",
          className,
        )}
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Initializing editor...</p>
        </div>
      </div>
    )
  }

  if (editorError) {
    return (
      <div
        className={cn("border rounded-md bg-destructive/10 w-full p-4 text-destructive text-sm", className)}
        style={{ height }}
      >
        <p>Code editor failed to load. Using fallback textarea.</p>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-full mt-2 p-2 border rounded resize-none font-mono text-sm bg-background"
          disabled={disabled || readOnly}
        />
      </div>
    )
  }

  return (
    <div className={cn("border rounded-md overflow-hidden", disabled && "opacity-80 pointer-events-none", className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading editor...</p>
          </div>
        </div>
      )}
      <Editor
        height={height}
        language={normalizedLanguage}
        value={value}
        onChange={handleEditorChange}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        loading={null} // Disable default loading
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
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          renderWhitespace: "selection",
          bracketPairColorization: { enabled: true },
        }}
        {...rest}
      />
    </div>
  )
}
