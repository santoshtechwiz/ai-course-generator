import type React from "react"
import type { Metadata } from "next"
import "../globals.css"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { RootLayoutProvider } from "@/providers/root-layout-provider"
import Footer from "@/components/shared/Footer"
import { JsonLd } from "@/app/schema/components/json-ld"


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
  // Fetch session once at root level to pass to providers
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" suppressHydrationWarning className={`scroll-smooth`}>
      <head>
        <meta name="msvalidate.01" content="7287DB3F4302A848097237E800C21964" />
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col scrollbar-hide">
        <RootLayoutProvider session={session}>
          <main className="flex-1 flex flex-col pt-16">{children}</main>
          <Footer />
        </RootLayoutProvider>

        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
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
          }} type={"course"}        
        />
      </body>
    </html>
  )
}
