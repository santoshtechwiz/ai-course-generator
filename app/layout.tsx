import type React from "react"
import type { Metadata } from "next"

import { RootProvider } from "@/providers/root-provider"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import "./globals.css"
import { Suspense } from "react"

// const inter = Inter({ subsets: ["latin"] })

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootProvider session={session}>
          <Suspense>{children}</Suspense>
        </RootProvider>
      </body>
    </html>
  )
}
