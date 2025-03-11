import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { Analytics } from "@/app/analytics"
import { defaultSEO } from "@/lib/seo-utils"
import { JsonLd } from "@/components/json-ld"
import Footer from "@/components/shared/Footer"
import { Providers } from "@/providers/provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: defaultSEO.title,
    template: `%s | ${defaultSEO.siteName}`,
  },
  description: defaultSEO.description,
  keywords: defaultSEO.keywords,
  authors: [
    {
      name: process.env.NEXT_PUBLIC_AUTHOR_NAME || "CourseAI Team",
      url: process.env.NEXT_PUBLIC_AUTHOR_URL,
    },
  ],
  creator: process.env.NEXT_PUBLIC_CREATOR || "CourseAI",
  openGraph: {
    type: "website",
    locale: defaultSEO.locale,
    url: defaultSEO.baseUrl,
    title: defaultSEO.title,
    description: defaultSEO.description,
    siteName: defaultSEO.siteName,
    images: [
      {
        url: `${defaultSEO.baseUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: defaultSEO.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultSEO.title,
    description: defaultSEO.description,
    creator: defaultSEO.twitterHandle,
    images: [`${defaultSEO.baseUrl}/twitter-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: defaultSEO.baseUrl,
    languages: {
      "en-US": defaultSEO.baseUrl,
    },
  },
  metadataBase: new URL(defaultSEO.baseUrl),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <JsonLd />
          {children}
          <Analytics />
          <Footer></Footer>
        </Providers>
      </body>
    </html>
  )
}

