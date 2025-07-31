"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Home, RefreshCw, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorPageProps) {
  const router = useRouter()

  useEffect(() => {
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      // Example: Sentry.captureException(error)
      if (typeof window !== "undefined" && (window as any).Sentry) {
        (window as any).Sentry.captureException?.(error);
      }
    } else {
      // Always log to console for debugging in dev
      console.error("App error boundary:", error)
    }
  }, [error])

  const handleReset = () => {
    reset()
    router.push("/")
  }

  return (
    <div className="flex min-h-screen bg-background p-6 md:p-10 items-center justify-center">
      <Card className="max-w-xl w-full shadow-lg border border-border/50">
        <CardHeader className="text-center border-b pb-6 space-y-4">
          <div className="mx-auto mb-6 bg-destructive/10 p-4 rounded-full w-20 h-20 flex items-center justify-center">
            <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="pt-8 space-y-6">
          <p className="text-muted-foreground text-center text-lg leading-relaxed">
            Sorry, an unexpected error occurred. Please try again or contact support if the problem persists.
          </p>
          {/* Only show error details in development */}
          {process.env.NODE_ENV !== "production" && error.message && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-semibold">Error Details</AlertTitle>
              <AlertDescription className="mt-2 break-words">{error.message}</AlertDescription>
            </Alert>
          )}
          {process.env.NODE_ENV === "development" && error.digest && (
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
              <p>Error Digest: {error.digest}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center border-t pt-8 pb-6">
          <Button onClick={handleReset} className="w-full sm:w-auto h-11 text-base font-medium">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto h-11 text-base font-medium">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto h-11 text-base font-medium"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
