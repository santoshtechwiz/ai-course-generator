"use client"

import type React from "react"
import Editor from "@monaco-editor/react"
import type { CodeQuizEditorProps } from "@/app/types/code-quiz-types"

interface ExtendedCodeQuizEditorProps extends CodeQuizEditorProps {
  height?: string
}

const CodeQuizEditor: React.FC<ExtendedCodeQuizEditorProps> = ({
  value,
  language,
  readOnly = false,
  onChange,
  height = "180px", // Default to a smaller height
}) => {
  return (
    <div className="border rounded-md overflow-hidden" style={{ height }}>
      <Editor
        height="100%"
        language={language}
        value={value}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: "on",
          folding: true,
          automaticLayout: true,
        }}
        onChange={onChange}
      />
    </div>
  )
}

export default CodeQuizEditor
