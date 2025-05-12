import Link from "next/link"
import { ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="flex flex-col items-center max-w-md text-center space-y-6">
        <div className="bg-destructive/10 p-3 rounded-full">
          <ShieldAlert className="h-12 w-12 text-destructive" />
        </div>

        <h1 className="text-3xl font-bold">Access Denied</h1>

        <p className="text-muted-foreground">
          You don't have permission to access this page. This area is restricted to administrators only.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button asChild variant="default" className="w-full sm:w-auto">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
