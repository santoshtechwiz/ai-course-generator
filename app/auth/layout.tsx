"use client"

import React, { Suspense } from "react"
import { Loader2 } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
          <div className="flex justify-center items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
