"use client"

import { ErrorBoundary } from "@/components/common/ErrorBoundary"
import { PageWrapper } from "@/components/layout/PageWrapper"
import { Suspense } from "react"
import { SuspenseGlobalFallback } from "@/components/loaders"
import { reportError } from "@/lib/error-reporting"

interface PageContainerProps {
  children: React.ReactNode
  loadingText?: string
  fallback?: React.ReactNode
  withSuspense?: boolean
}

export function PageContainer({ 
  children, 
  loadingText = "Loading...",
  fallback,
  withSuspense = true
}: PageContainerProps) {
  const content = withSuspense ? (
    <Suspense fallback={<SuspenseGlobalFallback text={loadingText} />}>
      {children}
    </Suspense>
  ) : children

  return (
    <ErrorBoundary
      fallback={fallback}
      onError={(error, errorInfo) => {
        console.error('Page error:', error)
        reportError(error, { componentStack: errorInfo?.componentStack || undefined })
      }}
    >
      <PageWrapper>
        {content}
      </PageWrapper>
    </ErrorBoundary>
  )
}
