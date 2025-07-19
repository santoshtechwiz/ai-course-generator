import type { Metadata } from "next";
import "../globals.css";

import { DefaultSEO, defaultMetadata } from "@/lib/seo-manager-new";
import Footer from "@/components/shared/Footer";
import { Providers } from "@/store/provider";
import { getServerAuthSession } from "@/lib/server-auth";
import ClientLayoutWrapper from "./client-layout-wrapper";
import { Suspense } from "react";
import { font } from "./font";

import { GlobalLoader } from "@/components/loaders";
import GlobalLoaderProvider from "@/components/GlobalLoaderProvider";
import SuspenseGlobalFallback from "@/components/loaders/SuspenseGlobalFallback";


export const metadata: Metadata = {
  ...defaultMetadata,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"
  ),
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
    "AI learning platform",
    "programming education",
    "learn to code",
    "coding quiz app",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://courseai.io",
    siteName: "CourseAI",
    title: "CourseAI - Interactive Programming Quizzes and Learning",
    description:
      "Enhance your programming skills with interactive quizzes, coding challenges, and learning resources designed for developers of all levels.",
    images: [
      {
        url: "/images/og/courseai-og.png",
        width: 1200,
        height: 630,
        alt: "CourseAI - Interactive Programming Learning Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CourseAI - Interactive Programming Quizzes and Learning",
    description:
      "Enhance your programming skills with interactive quizzes, coding challenges, and learning resources designed for developers of all levels.",
    creator: "@courseai",
    images: ["/images/og/courseai-og.png"],
  },
};

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

          <DefaultSEO currentPath="/" includeFAQ={true} />
        </body>
      </html>
      <GlobalLoader />
    </GlobalLoaderProvider>
  );
}