import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

import { RootProvider } from "@/providers/root-provider"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import "./globals.css"
import { Suspense } from "react"
// Update the layout to use the unified auth provider
import { UnifiedAuthProvider } from "@/providers/unified-auth-provider"
// Keep other imports as they are

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Learning Platform",
    template: "%s | Learning Platform",
  },
  description: "An AI-powered learning platform for courses and quizzes",
  keywords: ["education", "learning", "courses", "quizzes", "AI"],
  authors: [{ name: "Learning Platform Team" }],
  creator: "Learning Platform",
  publisher: "Learning Platform",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://learning-platform.com",
    title: "Learning Platform",
    description: "An AI-powered learning platform for courses and quizzes",
    siteName: "Learning Platform",
  },
  twitter: {
    card: "summary_large_image",
    title: "Learning Platform",
    description: "An AI-powered learning platform for courses and quizzes",
    creator: "@learningplatform",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <RootProvider session={session}>
          <UnifiedAuthProvider>
            <Suspense>
              {children}
           
            </Suspense>
          </UnifiedAuthProvider>
        </RootProvider>
      </body>
    </html>
  )
}
