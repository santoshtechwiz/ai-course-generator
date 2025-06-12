import type React from "react"
import type { Metadata } from "next"
import "../globals.css"

import { AuthProvider } from '@/context/auth-context'
import { AuthConsumer } from '@/context/auth-context'
import { getServerAuthSession } from '@/lib/server-auth'
import { Providers } from "@/store/provider"


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"),
  title: {
    default: "CourseAI - Interactive Programming Quizzes and Learning",
    template: "%s | CourseAI",
  },
  description:
    "Enhance your programming skills with interactive quizzes, coding challenges, and learning resources designed for developers of all levels.",
  keywords: [
    "programming quizzes",
    "coding challenges",
    "developer learning",
    "interactive coding",
    "tech education",
    "programming practice",
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
  alternates: {
    canonical: "/",
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Get the session server-side for initial hydration
  const session = await getServerAuthSession()

  return (
    <html lang="en">
      <body>
        <AuthProvider session={session}>
          <Providers>
            <AuthConsumer>
              {children}
            </AuthConsumer>
          </Providers>
        </AuthProvider>
      </body>
    </html>
  )
}
