import { Metadata } from "next";

export const notFoundMetadata: Metadata = {
  title: "Page Not Found | CourseAI",
  description:
    "We couldn't find the page you're looking for. Explore our recommended courses and quizzes instead.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: {
    canonical: "https://courseai.com/404",
  },
  openGraph: {
    title: "Page Not Found | CourseAI",
    description:
      "We couldn't find the page you're looking for. Explore our recommended courses and quizzes instead.",
    url: "https://courseai.com/404",
    siteName: "CourseAI",
    images: [
      {
        url: "/images/og-image-404.jpg",
        width: 1200,
        height: 630,
        alt: "CourseAI - Page Not Found",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Page Not Found | CourseAI",
    description:
      "We couldn't find the page you're looking for. Explore our recommended courses and quizzes instead.",
    images: ["/images/og-image-404.jpg"],
    creator: "@courseai",
  },
};
