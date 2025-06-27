import { getProviders } from "next-auth/react"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { AuthButtonGroup } from "./components/AuthButtonGroup"
import { BenefitsCarousel } from "./components/BenefitsCarousel"
import { Suspense } from "react"
import { EnhancedLoader } from "@/components/ui/enhanced-loader"




export const metadata = {
  title: "Sign In ",
  description: "Sign in to your Course AI account to access your courses, quizzes, and learning progress.",
  keywords: ["sign in", "login", "account access", "user authentication", "course platform login"],
  robots: {
    index: false,
    follow: false,
  },
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const session = await getServerSession(authOptions)
  const { callbackUrl } = await searchParams

  if (session) {
    redirect(callbackUrl || "/")
  }

  const providers = await getProviders()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-6">
      <div className="flex flex-col lg:flex-row bg-white shadow-2xl rounded-2xl overflow-hidden w-full max-w-6xl">
        <div className="flex-1 p-10 md:p-14">
          <div className="text-4xl font-bold text-center mb-10 text-gray-800">Log in to Course AI</div>

          <div className="flex flex-col space-y-6 items-center">
            <Suspense fallback={<EnhancedLoader isLoading={true} message="Loading providers..." fullscreen />}>
              {providers && <AuthButtonGroup providers={providers} callbackUrl={callbackUrl || "/"} />}
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
