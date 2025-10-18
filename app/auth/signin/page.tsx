import { getProviders } from "next-auth/react"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { AuthButtonGroup } from "./components/AuthButtonGroup"
import { BenefitsCarousel } from "./components/BenefitsCarousel"
import { Suspense } from "react"



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
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="flex flex-col lg:flex-row bg-card border-3 border-border shadow-[8px_8px_0px_0px_var(--border)] rounded-lg overflow-hidden w-full max-w-6xl">
        <div className="flex-1 p-10 md:p-14">
          <div className="text-4xl font-bold text-center mb-10">Log in to Course AI</div>

          <div className="flex flex-col space-y-6 items-center">
            <Suspense fallback={<div className="flex justify-center py-4"><span className="h-6 w-6 inline-block rounded-full border-2 border-primary/30 border-t-primary animate-spin" /></div>}>
              {providers && <AuthButtonGroup providers={providers} callbackUrl={callbackUrl || "/"} />}
            </Suspense>
          </div>

          <div className="mt-8 text-xs text-muted-foreground text-center">
            By logging in, you agree to Course AI's{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-primary hover:underline text-sm">
              Go Back to Home Page
            </Link>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 bg-main text-main-foreground border-l-3 border-border">
          <BenefitsCarousel />
        </div>
      </div>
    </div>
  )
}
