import { Inter } from 'next/font/google'

import './globals.css'

import { Metadata } from 'next';
import { Providers } from './providers/provider';
import Head from 'next/head';



const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
export const metadata: Metadata = {
  title: {
    default: "Course AI",
    template: "%s | Course AI",
  },
  description: "AI-powered course creation and learning platform",
  keywords: ["AI", "education", "online courses", "learning platform"],
  authors: [{ name: "Your Name", url: "https://yourwebsite.com" }],
  creator: "Your Name or Company",
  metadataBase: new URL("https://your-website-url.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://your-website-url.com",
    title: "Course AI",
    description: "AI-powered course creation and learning platform",
    siteName: "Course AI",
    images: [
      {
        url: "https://your-website-url.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Course AI Open Graph Image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Course AI",
    description: "AI-powered course creation and learning platform",
    images: ["https://your-website-url.com/twitter-image.jpg"],
    creator: "@yourtwitter",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      {/* <Head>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Lora:wght@400;700&display=swap" rel="stylesheet">
      </link>

      </Head> */}
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

