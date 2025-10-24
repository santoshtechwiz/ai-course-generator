import { UnifiedLoader } from "@/components/loaders"

export default function Loading() {
  return (
    <div className="container max-w-4xl mx-auto p-6 bg-[var(--color-bg)] min-h-screen">
      <div className="flex items-center justify-center min-h-[60vh]">
        <UnifiedLoader
          message="Loading Contact Messages..."
          variant="spinner"
          size="lg"
        />
      </div>
    </div>
  )
}
