import { getProviders } from "next-auth/react"
import { AuthButtonGroup } from "@/components/AuthButtonGroup"
import { BenefitsCarousel } from "@/components/BenefitsCarousel"
import Link from "next/link"
import { authOptions } from "@/lib/authOptions"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const session = await getServerSession(authOptions)
  const {callbackUrl}=await searchParams;
  if (session) {
    redirect(callbackUrl|| "/")
  }

  const providers = await getProviders()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="flex flex-col lg:flex-row bg-white shadow-2xl rounded-2xl overflow-hidden w-full max-w-6xl">
        <div className="flex-1 p-8 md:p-12">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
            Log in to Course AI
          </h1>

          <div className="flex flex-col space-y-4 items-center">
            {providers && <AuthButtonGroup providers={providers} callbackUrl={callbackUrl || "/"} />}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-indigo-600 hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>

          <p className="mt-6 text-xs text-gray-500 text-center">
            By logging in, you agree to Course AI's{" "}
            <Link href="/terms" className="text-indigo-600 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-indigo-600 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="hidden lg:flex flex-1 bg-indigo-600 text-white">
          <BenefitsCarousel />
        </div>
      </div>
    </div>
  )
}
