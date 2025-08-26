"use client"

import { ReactNode } from "react"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { PageLoading } from "@/components/ui/loading"
import { Suspense } from "react"

interface DashboardWrapperProps {
  children: ReactNode
  loadingText?: string
}

export function DashboardWrapper({
  children,
  loadingText = "Loading content..."
}: DashboardWrapperProps) {
  return (
    <ErrorBoundary
      fallback={({ error, reset }) => (
        <PageWrapper>
          <Alert variant="destructive" className="max-w-2xl mx-auto my-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Something went wrong!</AlertTitle>
            <AlertDescription className="mt-2 mb-4">
              {error?.message || "There was an error loading this content."}
            </AlertDescription>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => reset()}
              className="mt-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </Alert>
        </PageWrapper>
      )}
    >
      <PageWrapper>
        <Suspense fallback={<PageLoading text={loadingText} />}>
          {children}
        </Suspense>
      </PageWrapper>
    </ErrorBoundary>
  )
}
