"use client"

import { Suspense, lazy } from "react"
import { Loader2 } from "lucide-react"

// Lazy load the UserForm component
const UserForm = lazy(() => import("../user-form").then((mod) => ({ default: mod.UserForm })))

export function LazyUserForm() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <UserForm />
    </Suspense>
  )
}

