"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Dynamic import Monaco Editor to reduce initial bundle size
// Monaco is ~2MB minified, only load when needed
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[400px] bg-muted/50 rounded-lg">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading code editor...</p>
      </div>
    </div>
  ),
  ssr: false,
})

export default MonacoEditor
