import type React from "react"
import type { Metadata } from "next"
import { Outfit, Space_Grotesk } from 'next/font/google'
import "../globals.css"

import { AuthProvider } from '@/context/auth-context'
import { AuthConsumer } from '@/context/auth-context'
import { getServerAuthSession } from '@/lib/server-auth'
import { Providers } from "@/store/provider"


const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

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
  authors: [{ name: 'CourseAI' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#ffffff',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    title: 'CourseAI - Interactive Programming Quizzes and Learning',
    description: 'Enhance your programming skills with interactive quizzes and coding challenges.',
    siteName: 'CourseAI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CourseAI - Interactive Programming Quizzes and Learning',
    description: 'Enhance your programming skills with interactive quizzes and coding challenges.',
  },
  alternates: {
    canonical: "/",
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Get the session server-side for initial hydration
  const session = await getServerAuthSession()

  return (
    <html lang="en" className={`${outfit.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen antialiased font-body">
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
