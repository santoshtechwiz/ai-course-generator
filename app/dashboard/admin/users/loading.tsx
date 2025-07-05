export default function Loading() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <p className="text-muted-foreground mb-8">Manage your users, view profiles, and handle subscriptions.</p>
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm font-medium text-gray-700">Loading user data...</p>
        </div>
      </div>
    </div>
  )
}
