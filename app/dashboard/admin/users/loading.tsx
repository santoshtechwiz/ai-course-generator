import { GlobalLoader } from "@/components/ui/loader"

export default function Loading() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <p className="text-muted-foreground mb-8">Manage your users, view profiles, and handle subscriptions.</p>      <div className="flex items-center justify-center h-[400px]">
        <GlobalLoader size="lg" text="Loading user data..." theme="primary" />
      </div>
    </div>
  )
}
