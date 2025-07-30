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
import { defaultMetadata, DefaultSEO } from "@/lib/seo-manager";


export const metadata: Metadata = {
  ...defaultMetadata,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"
  ),
  title: {
    default: "CourseAI - AI-Powered Courses & Quizzes for Every Topic",
    template: "%s | CourseAI",
  },
  description:
    "CourseAI empowers everyone to create, share, and discover interactive courses and quizzes on any topic with the power of AI. Learn, teach, and test knowledge in any field—education, hobbies, business, and more.",
  keywords: [
    "CourseAI",
    "AI quizzes",
    "AI courses",
    "interactive learning",
    "quiz builder",
    "course creator",
    "education platform",
    "learn anything",
    "teach online",
    "knowledge testing",
    "AI education",
    "online quizzes",
    "online courses",
    "community learning",
    "personal development",
    "business training",
    "school resources",
    "hobby learning",
    "language learning",
    "science quizzes",
    "history courses"
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://courseai.io",
    siteName: "CourseAI",
    title: "CourseAI - AI-Powered Courses & Quizzes for Every Topic",
    description:
      "CourseAI empowers everyone to create, share, and discover interactive courses and quizzes on any topic with the power of AI. Learn, teach, and test knowledge in any field—education, hobbies, business, and more.",
    images: [
      {
        url: "/images/og/courseai-og.png",
        width: 1200,
        height: 630,
        alt: "CourseAI - AI-Powered Learning Platform for All Topics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CourseAI - AI-Powered Courses & Quizzes for Every Topic",
    description:
      "CourseAI empowers everyone to create, share, and discover interactive courses and quizzes on any topic with the power of AI. Learn, teach, and test knowledge in any field—education, hobbies, business, and more.",
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