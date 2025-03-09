"use client"

import Link from "next/link"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Home, RefreshCw, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Head from "next/head"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error occurred:", error)
  }, [error])

  return (
    <div className="flex min-h-screen bg-background p-4 md:p-8 items-center justify-center">
      {/* Next.js Head component for SEO */}
      <Head>
        <title>Something went wrong | Error Page</title>
        <meta
          name="description"
          content="We encountered an unexpected error. Our team has been notified and is working on a fix."
        />
        <meta name="robots" content="noindex" />
      </Head>

      <Card className="max-w-xl w-full shadow-lg">
        <CardHeader className="text-center border-b pb-4">
          <div className="mx-auto mb-4 bg-destructive/10 p-3 rounded-full w-16 h-16 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold">Oops! Something went wrong</CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center mb-6">
            We're sorry for the inconvenience. Our team has been notified and is working on a fix.
          </p>

          {error.message && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription className="mt-2 break-words">{error.message}</AlertDescription>
            </Alert>
          )}

          {process.env.NODE_ENV === "development" && error.digest && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              <p>Error Digest: {error.digest}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center border-t pt-6">
          <Button onClick={() => reset()} className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="secondary" onClick={() => window.history.back()} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

