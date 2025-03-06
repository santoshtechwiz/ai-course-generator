import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Document Analysis | Course AI",
  description:
    "Upload and analyze documents to generate quizzes, summaries, and learning materials from your own content.",
  keywords: [
    "document analysis",
    "content generation",
    "text processing",
    "educational materials",
    "document-based learning",
    "custom quizzes",
  ],
  openGraph: {
    title: "Document Analysis | Course AI",
    description:
      "Upload and analyze documents to generate quizzes, summaries, and learning materials from your own content.",
    url: "https://courseai.dev/dashboard/document",
    type: "website",
    images: [{ url: "/og-image-document.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Document Analysis | Course AI",
    description:
      "Upload and analyze documents to generate quizzes, summaries, and learning materials from your own content.",
    images: ["/twitter-image-document.jpg"],
  },
}

