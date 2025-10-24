import { UnifiedLoader } from "@/components/loaders"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="container max-w-md mx-auto p-6">
        <UnifiedLoader
          message="Loading Sign In..."
          variant="spinner"
          size="lg"
        />
      </div>
    </div>
  )
}
