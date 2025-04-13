"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthError() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("An unexpected authentication error occurred")
  const [errorDescription, setErrorDescription] = useState(
    "Please try signing in again or contact support if the problem persists.",
  )

  useEffect(() => {
    // Add a small delay to prevent flash of loading state
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    const error = searchParams.get("error")

    if (error) {
      switch (error) {
        case "Configuration":
          setErrorMessage("Server configuration error")
          setErrorDescription("There is a problem with the server configuration. Please contact support.")
          break
        case "AccessDenied":
          setErrorMessage("Access denied")
          setErrorDescription("You do not have permission to sign in.")
          break
        case "Verification":
          setErrorMessage("Verification error")
          setErrorDescription("The verification link may be invalid or has expired.")
          break
        case "OAuthSignin":
          setErrorMessage("OAuth sign in error")
          setErrorDescription("Error in the OAuth sign in process. Please try again with a different provider.")
          break
        case "OAuthCallback":
          setErrorMessage("OAuth callback error")
          setErrorDescription("Error in the OAuth callback process. Please try again later.")
          break
        case "OAuthCreateAccount":
          setErrorMessage("Account creation error")
          setErrorDescription("Could not create a user account. Please try again later.")
          break
        case "EmailCreateAccount":
          setErrorMessage("Email account creation error")
          setErrorDescription("Could not create an account with this email. Please use a different email.")
          break
        case "Callback":
          setErrorMessage("Callback error")
          setErrorDescription("Error during the authentication callback. Please try again.")
          break
        case "OAuthAccountNotLinked":
          setErrorMessage("Account not linked")
          setErrorDescription(
            "This email is already associated with another account. Please sign in using the original provider.",
          )
          break
        case "EmailSignin":
          setErrorMessage("Email sign in error")
          setErrorDescription("There was an error sending the email. Please try again.")
          break
        case "CredentialsSignin":
          setErrorMessage("Invalid credentials")
          setErrorDescription("The credentials you provided are invalid. Please check and try again.")
          break
        case "SessionRequired":
          setErrorMessage("Session required")
          setErrorDescription("You must be signed in to access this page.")
          break
        default:
          setErrorMessage("Authentication error")
          setErrorDescription("An error occurred during authentication. Please try again.")
      }
    }

    return () => clearTimeout(timer)
  }, [searchParams])

  const handleRetry = () => {
    router.push("/auth/signin")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="flex justify-center items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="max-w-md w-full shadow-lg border border-slate-200 dark:border-slate-700">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-medium">Authentication Error</span>
          </div>
          <CardTitle className="text-2xl">{errorMessage}</CardTitle>
          <CardDescription>{errorDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-md p-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              If you continue to experience issues, please contact our support team with the following error details:
              <br />
              <code className="mt-2 block p-2 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs overflow-x-auto">
                Error: {searchParams.get("error") || "Unknown"}
              </code>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/auth/signin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Link>
          </Button>
          <Button onClick={handleRetry} className="w-full sm:w-auto">
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
