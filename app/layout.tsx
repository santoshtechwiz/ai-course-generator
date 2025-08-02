import type { Metadata } from "next";
import "../globals.css";

import Footer from "@/components/shared/Footer";
import { Providers } from "@/store/provider";
import { getServerAuthSession } from "@/lib/server-auth";

import { Suspense } from "react";
import { font } from "./font";

import { GlobalLoader } from "@/components/loaders";
import GlobalLoaderProvider from "@/components/GlobalLoaderProvider";
import SuspenseGlobalFallback from "@/components/loaders/SuspenseGlobalFallback";
import { defaultMetadata, DefaultSEO, generateMetadata } from "@/lib/seo";

import { GoogleAnalytics } from '@next/third-parties/google'

export const metadata: Metadata = generateMetadata({
  title: "CourseAI - AI-Powered Educational Content Creator",
  description:
    "Create professional courses, quizzes, and educational content with AI. Empower educators, trainers, and learners with intelligent content generation tools for any subject.",
  keywords: [
    "AI course creator",
    "AI quiz generator", 
    "educational content creation",
    "e-learning platform",
    "course builder",
    "quiz maker",
    "AI education tools",
    "interactive learning",
    "assessment creation",
    "training materials",
    "online education",
    "educational technology",
    "automated content generation",
    "learning management",
    "course authoring",
    "educational AI",
    "teaching tools",
    "exam creator",
    "knowledge assessment",
    "courseai"
  ],
  canonical: "/",
  type: "website",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

  return (
    <GlobalLoaderProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className="scroll-smooth overflow-x-hidden"
      >
        <head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=5"
          />
          <meta name="msvalidate.01" content="7287DB3F4302A848097237E800C21964" />
          <meta
            name="google-site-verification"
            content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION}
          />
          <link rel="canonical" href={process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"} />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </head>

        <body
          className={`${font.roboto.className} ${font.poppins.className ?? ""} ${font.openSans.className ?? ""} antialiased bg-background text-foreground min-h-screen flex flex-col`}
        >
          <Providers session={session}>

            <main className="flex-1 w-full">
              <Suspense fallback={<SuspenseGlobalFallback />}>
                {children}
              </Suspense>
            </main>
            <Footer />

          </Providers>

          <DefaultSEO enableFAQ={false} />
        </body>
        <GoogleAnalytics gaId="G-8E6345HNS4" />
      </html>
      <GlobalLoader />
    </GlobalLoaderProvider>
  );
}