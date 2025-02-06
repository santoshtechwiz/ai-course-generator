import type React from "react"
import Editor from "@monaco-editor/react"

interface CodeQuizEditorProps {
  value: string
  language: string
  readOnly?: boolean
  onChange?: (value: string | undefined) => void
}

const CodeQuizEditor: React.FC<CodeQuizEditorProps> = ({ value, language, readOnly = false, onChange }) => {
  return (
    <div className="h-64 border rounded-md overflow-hidden">
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
        }}
        onChange={onChange}
      />
    </div>
  )
}

export default CodeQuizEditor

