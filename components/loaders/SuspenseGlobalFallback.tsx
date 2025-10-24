"use client"

import { NeoLoader } from "@/components/loader"

export function SuspenseGlobalFallback({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <NeoLoader
        message={text}
        size="md"
        variant="spinner"
        className="border-none bg-transparent shadow-none"
      />
    </div>
  )
}
