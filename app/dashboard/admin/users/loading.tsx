import { UnifiedLoader } from "@/components/loaders"

export default function Loading() {
  return (
    <div className="container mx-auto py-10 bg-[var(--color-bg)] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-[var(--color-text)]">User Management</h1>
        <p className="text-[var(--color-text)]/70">Manage your users, view profiles, and handle subscriptions.</p>
      </div>
      <div className="flex items-center justify-center h-[400px]">
        <UnifiedLoader
          message="Loading user data..."
          variant="spinner"
          size="lg"
        />
      </div>
    </div>
  )
}
