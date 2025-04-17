"use client"

import { useAuthRedirect } from "@/app/auth/hooks/useAuthRedirect"
import Link from "next/link"
import { AuthButtonGroup } from "./AuthButtonGroup"
import { BenefitsCarousel } from "./BenefitsCarousel"
import { Suspense } from "react"

function LoadingProviders() {
  return (
    <div className="flex flex-col space-y-3 w-full max-w-sm mx-auto px-4 sm:px-0">
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-full h-12 bg-gray-200 animate-pulse rounded-lg"></div>
      ))}
    </div>
  )
}

export default function SignInClientPage() {
  const { isLoading, isAuthenticated, callbackUrl } = useAuthRedirect()

  // If already authenticated, the hook will handle the redirect
  if (isLoading) {
    return <div>Loading...</div> // Or your loading component
  }

  // Only render the sign-in page if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-6">
        <div className="flex flex-col lg:flex-row bg-white shadow-2xl rounded-2xl overflow-hidden w-full max-w-6xl">
          <div className="flex-1 p-10 md:p-14">
            <div className="text-4xl font-bold text-center mb-10 text-gray-800">Log in to Course AI</div>

            <div className="flex flex-col space-y-6 items-center">
              <Suspense fallback={<LoadingProviders />}>
                <AuthButtonGroup callbackUrl={callbackUrl || "/"} />
              </Suspense>
            </div>

            <div className="mt-8 text-xs text-gray-500 text-center">
              By logging in, you agree to Course AI's{" "}
              <Link href="/terms" className="text-indigo-600 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-indigo-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </div>

            <div className="mt-4 text-center">
              <Link href="/" className="text-indigo-600 hover:underline text-sm">
                Go Back to Home Page
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex flex-1 bg-indigo-700 text-white">
            <BenefitsCarousel />
          </div>
        </div>
      </div>
    )
  }

  return null // Don't render anything while redirecting
}
