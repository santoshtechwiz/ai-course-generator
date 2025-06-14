import type React from "react"
import type { Metadata } from "next"
import "../globals.css"
import { JsonLD } from "@/app/schema/components"
import { defaultMetadata } from "@/lib/seo"

import { Inter } from "next/font/google"


import Footer from "@/components/shared/Footer"
import { getAuthSession } from "@/lib/auth"
import { AuthProvider, AuthConsumer } from "@/context/auth-context"
import { Providers } from "@/store/provider"
import { getServerAuthSession } from "@/lib/server-auth"


const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
})

export const metadata: Metadata = {
  ...defaultMetadata,
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
 
  return (
    <html lang="en" suppressHydrationWarning className={` scroll-smooth`}>
      <head>
        <meta name="msvalidate.01" content="7287DB3F4302A848097237E800C21964" />
      </head>
      <body className={`${inter.className} font-sans antialiased min-h-screen flex flex-col`}>
           <Providers>
          
              {children}
          
          </Providers>
          <Footer />
      
        <JsonLD
          type="website"
          data={{
            name: "Course AI",
            description: "AI-powered course and quiz generator for personalized learning",
            url: process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.app",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.app"}/search?q={search_term_string}`,
              },
              "query-input": "required name=search_term_string",
            },
          }}
        />
      </body>
    </html>
  )
}