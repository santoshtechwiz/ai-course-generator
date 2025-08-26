"use client"

export function SuspenseGlobalFallback({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-r-transparent" />
        <span className="text-muted-foreground">{text}</span>
      </div>
    </div>
  )
}
