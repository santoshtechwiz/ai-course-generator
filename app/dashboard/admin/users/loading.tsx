import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <p className="text-muted-foreground mb-8">Manage your users, view profiles, and handle subscriptions.</p>

      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  )
}

