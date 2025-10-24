import { UnifiedLoader } from "@/components/loaders"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
      <UnifiedLoader
        message="Loading..."
        variant="spinner"
        size="lg"
      />
    </div>
  )
}
